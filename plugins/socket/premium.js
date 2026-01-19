import { 
  useMultiFileAuthState, 
  makeCacheableSignalKeyStore, 
  fetchLatestBaileysVersion,
  makeWASocket,
  Browsers
} from "@whiskeysockets/baileys"
import path from 'path'
import fs from 'fs'
import pino from 'pino'
import chalk from 'chalk'
import qrcode from 'qrcode'
import NodeCache from 'node-cache'

// Función para crear bot premium
export async function createPremiumBot(ownerPhone, botPhone, label = 'Bot Premium') {
  const ownerDigits = ownerPhone.replace(/\D/g, '')
  const botDigits = botPhone.replace(/\D/g, '')
  
  // Verificar que el owner sea premium
  if (!global.premiumUsers.includes(ownerDigits) && 
      !global.owner.map(v => v.replace(/\D/g, '')).includes(ownerDigits)) {
    throw new Error('El propietario no es usuario premium')
  }
  
  // Verificar límite de bots
  const userBots = Object.values(global.premiumBots).filter(bot => 
    bot.owner === ownerDigits
  ).length
  
  if (userBots >= global.premiumFeatures.maxSubBots) {
    throw new Error(`Límite de bots alcanzado (${global.premiumFeatures.maxSubBots})`)
  }
  
  // Crear directorio de sesión
  const sessionPath = path.join(process.cwd(), 'Sessions', 'Premium', ownerDigits, botDigits)
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true })
  }
  
  // Configuración inicial del bot
  const botConfig = {
    owner: ownerDigits,
    phone: botDigits,
    label: label,
    sessionPath: sessionPath,
    created: new Date().toISOString(),
    status: 'offline',
    config: {
      ...global.defaultConfig,
      name: label,
      ownerNumber: ownerDigits,
      isPremium: true,
      version: global.vs
    },
    stats: {
      messages: 0,
      groups: 0,
      users: 0,
      uptime: 0
    }
  }
  
  // Guardar configuración
  global.premiumBots[botDigits] = botConfig
  global.savePremiumData()
  
  return botConfig
}

// Función para iniciar bot premium
export async function startPremiumBot(botPhone) {
  const botDigits = botPhone.replace(/\D/g, '')
  const botConfig = global.premiumBots[botDigits]
  
  if (!botConfig) {
    throw new Error('Bot no encontrado')
  }
  
  const { state, saveCreds } = await useMultiFileAuthState(botConfig.sessionPath)
  const { version } = await fetchLatestBaileysVersion()
  
  const msgRetryCache = new NodeCache()
  
  const connectionOptions = {
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: Browsers.macOS('Safari'),
    version: version,
    generateHighQualityLinkPreview: true,
    msgRetryCounterCache: msgRetryCache,
    syncFullHistory: false,
    markOnlineOnConnect: true
  }
  
  const sock = makeWASocket(connectionOptions)
  sock.botConfig = botConfig
  
  // Eventos de conexión
  sock.ev.on('creds.update', saveCreds)
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    
    if (qr) {
      // Generar QR para panel web
      try {
        const qrBuffer = await qrcode.toBuffer(qr, { scale: 10 })
        const qrPath = path.join(botConfig.sessionPath, 'qr.png')
        fs.writeFileSync(qrPath, qrBuffer)
        
        // Actualizar estado
        botConfig.status = 'waiting_qr'
        global.savePremiumData()
      } catch (e) {
        console.error('Error generando QR:', e)
      }
    }
    
    if (connection === 'open') {
      console.log(chalk.green(`✨ BOT PREMIUM CONECTADO: +${botDigits}`))
      
      // Actualizar configuración
      botConfig.status = 'online'
      botConfig.connectedAt = new Date().toISOString()
      botConfig.config.name = sock.user?.name || botConfig.config.name
      
      // Agregar a conexiones activas
      if (!global.premiumConns.includes(sock)) {
        global.premiumConns.push(sock)
      }
      
      // Configurar auto-reconexión
      if (global.premiumFeatures.autoRestart) {
        setupAutoReconnect(sock, botDigits)
      }
      
      global.savePremiumData()
    }
    
    if (connection === 'close') {
      botConfig.status = 'offline'
      global.savePremiumData()
      
      // Auto-reconexión para premium
      if (global.premiumFeatures.autoRestart) {
        setTimeout(() => {
          console.log(chalk.yellow(`🔄 Reconectando bot premium +${botDigits}...`))
          startPremiumBot(botDigits).catch(console.error)
        }, 5000)
      }
    }
  })
  
  // Manejar mensajes
  sock.ev.on('messages.upsert', async (m) => {
    if (botConfig.stats) {
      botConfig.stats.messages++
    }
  })
  
  return sock
}

// Configurar auto-reconexión
function setupAutoReconnect(sock, botDigits) {
  setInterval(() => {
    if (!sock.user?.id) {
      console.log(chalk.yellow(`🔄 Reintentando conexión para +${botDigits}...`))
      startPremiumBot(botDigits).catch(console.error)
    }
  }, 300000)
}

// Función para editar configuración de bot
export function editPremiumBotConfig(botPhone, newConfig) {
  const botDigits = botPhone.replace(/\D/g, '')
  const botConfig = global.premiumBots[botDigits]
  
  if (!botConfig) {
    throw new Error('Bot no encontrado')
  }
  
  // Actualizar configuración
  botConfig.config = {
    ...botConfig.config,
    ...newConfig,
    updated: new Date().toISOString()
  }
  
  global.savePremiumData()
  return botConfig
}

// Función para obtener bots de un usuario
export function getUserPremiumBots(ownerPhone) {
  const ownerDigits = ownerPhone.replace(/\D/g, '')
  return Object.values(global.premiumBots).filter(bot => 
    bot.owner === ownerDigits
  )
}

// Función para eliminar bot premium
export async function deletePremiumBot(botPhone) {
  const botDigits = botPhone.replace(/\D/g, '')
  const botConfig = global.premiumBots[botDigits]
  
  if (!botConfig) {
    throw new Error('Bot no encontrado')
  }
  
  // Cerrar conexión si está activa
  const connIndex = global.premiumConns.findIndex(conn => 
    conn.botConfig?.phone === botDigits
  )
  
  if (connIndex !== -1) {
    try {
      global.premiumConns[connIndex].ws.close()
    } catch (e) {}
    global.premiumConns.splice(connIndex, 1)
  }
  
  // Eliminar sesión
  if (fs.existsSync(botConfig.sessionPath)) {
    fs.rmSync(botConfig.sessionPath, { recursive: true, force: true })
  }
  
  // Eliminar de la base de datos
  delete global.premiumBots[botDigits]
  global.savePremiumData()
  
  return true
}
