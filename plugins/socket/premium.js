import { 
  useMultiFileAuthState, 
  makeCacheableSignalKeyStore, 
  fetchLatestBaileysVersion,
  makeWASocket,
  Browsers
} from "@whiskeysockets/baileys"
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import pino from 'pino'
import chalk from 'chalk'
import qrcode from 'qrcode'
import NodeCache from 'node-cache'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Función para crear bot premium
export async function createPremiumBot(ownerPhone, botPhone, label = 'Bot Premium') {
  try {
    const ownerDigits = ownerPhone.replace(/\D/g, '')
    const botDigits = botPhone.replace(/\D/g, '')
    
    // Verificar que el owner sea premium
    if (!global.premiumUsers || !global.premiumUsers.includes(ownerDigits)) {
      if (!global.owner || !global.owner.map(v => v.replace(/\D/g, '')).includes(ownerDigits)) {
        throw new Error('El propietario no es usuario premium')
      }
    }
    
    // Verificar límite de bots
    if (global.premiumBots) {
      const userBots = Object.values(global.premiumBots).filter(bot => 
        bot.owner === ownerDigits
      ).length
      
      const maxBots = global.premiumFeatures?.maxSubBots || 5
      if (userBots >= maxBots) {
        throw new Error(`Límite de bots alcanzado (${maxBots})`)
      }
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
        ...(global.defaultConfig || {
          banner: "https://cdn.sockywa.xyz/files/JmRs.jpeg",
          icon: "https://cdn.sockywa.xyz/files/RTnq.jpeg",
          name: "Bot Premium",
          prefix: ".",
          status: "✨ Usando Asta Bot Premium"
        }),
        name: label,
        ownerNumber: ownerDigits,
        isPremium: true,
        version: global.vs || "1.0"
      },
      stats: {
        messages: 0,
        groups: 0,
        users: 0,
        uptime: 0
      }
    }
    
    // Inicializar si no existe
    if (!global.premiumBots) global.premiumBots = {}
    
    // Guardar configuración
    global.premiumBots[botDigits] = botConfig
    
    // Guardar en archivo
    if (typeof global.savePremiumData === 'function') {
      global.savePremiumData()
    }
    
    console.log(chalk.green(`✅ Bot premium creado: +${botDigits} para +${ownerDigits}`))
    return botConfig
    
  } catch (error) {
    console.error('Error en createPremiumBot:', error)
    throw error
  }
}

// Función para iniciar bot premium
export async function startPremiumBot(botPhone) {
  try {
    const botDigits = botPhone.replace(/\D/g, '')
    
    if (!global.premiumBots || !global.premiumBots[botDigits]) {
      throw new Error('Bot no encontrado en la base de datos')
    }
    
    const botConfig = global.premiumBots[botDigits]
    
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
          if (typeof global.savePremiumData === 'function') {
            global.savePremiumData()
          }
        } catch (e) {
          console.error('Error generando QR:', e)
        }
      }
      
      if (connection === 'open') {
        console.log(chalk.green(`✨ BOT PREMIUM CONECTADO: +${botDigits}`))
        
        // Actualizar configuración
        botConfig.status = 'online'
        botConfig.connectedAt = new Date().toISOString()
        
        // Agregar a conexiones activas
        if (!global.premiumConns) global.premiumConns = []
        if (!global.premiumConns.includes(sock)) {
          global.premiumConns.push(sock)
        }
        
        // Guardar cambios
        if (typeof global.savePremiumData === 'function') {
          global.savePremiumData()
        }
      }
      
      if (connection === 'close') {
        botConfig.status = 'offline'
        if (typeof global.savePremiumData === 'function') {
          global.savePremiumData()
        }
        
        // Auto-reconexión para premium
        if (global.premiumFeatures?.autoRestart) {
          setTimeout(() => {
            console.log(chalk.yellow(`🔄 Reconectando bot premium +${botDigits}...`))
            startPremiumBot(botDigits).catch(console.error)
          }, 5000)
        }
      }
    })
    
    return sock
    
  } catch (error) {
    console.error('Error en startPremiumBot:', error)
    throw error
  }
}

// Función para obtener bots de un usuario
export function getUserPremiumBots(ownerPhone) {
  try {
    const ownerDigits = ownerPhone.replace(/\D/g, '')
    
    if (!global.premiumBots) {
      return []
    }
    
    return Object.values(global.premiumBots).filter(bot => 
      bot.owner === ownerDigits
    )
  } catch (error) {
    console.error('Error en getUserPremiumBots:', error)
    return []
  }
}
