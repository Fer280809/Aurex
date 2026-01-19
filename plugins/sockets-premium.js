import { 
  useMultiFileAuthState, 
  DisconnectReason, 
  makeCacheableSignalKeyStore, 
  fetchLatestBaileysVersion,
  makeWASocket,
  Browsers,
  jidDecode
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

// COMANDO PARA AGREGAR USUARIO PREMIUM
let handler = async (m, { conn, args, usedPrefix, command, isROwner }) => {
  if (!isROwner) return m.reply(`❀ Este comando solo puede ser usado por el creador del bot.`)
  
  let target = args[0]
  if (!target && m.quoted) {
    target = m.quoted.sender.split('@')[0]
  } else if (m.mentionedJid && m.mentionedJid[0]) {
    target = m.mentionedJid[0].split('@')[0]
  }
  
  if (!target) return m.reply(`❀ Uso: ${usedPrefix}supprem <número o @usuario>\nEj: ${usedPrefix}supprem 521234567890`)
  
  // Normalizar número
  let phoneNumber = target.replace(/\D/g, '')
  if (phoneNumber.length === 10 && phoneNumber.startsWith('1')) {
    phoneNumber = '521' + phoneNumber.slice(1)
  } else if (phoneNumber.length === 10) {
    phoneNumber = '52' + phoneNumber
  }
  
  // Verificar si ya es premium
  if (global.premiumUsers.includes(phoneNumber)) {
    return m.reply(`❀ El usuario +${phoneNumber} ya es premium.`)
  }
  
  // Agregar como premium
  global.premiumUsers.push(phoneNumber)
  global.savePremiumData()
  
  // Mensaje de confirmación
  const message = `✨ *USUARIO PREMIUM AGREGADO* ✨

✅ *Usuario:* +${phoneNumber}
✅ *Agregado por:* @${m.sender.split('@')[0]}
✅ *Fecha:* ${new Date().toLocaleDateString('es-MX')}
✅ *Hora:* ${new Date().toLocaleTimeString('es-MX')}

📋 *Beneficios Premium:*
• Crear hasta ${global.premiumFeatures.maxSubBots} bots
• Panel web de administración
• Edición completa (nombre, banner, ícono)
• Prefijo personalizable
• Anti-eliminación de mensajes
• Reconexión automática
• Soporte prioritario

🌐 *Panel Web:* http://localhost:3000 (o tu dominio)
🔑 *Token de acceso:* ${phoneNumber}

*El usuario recibirá un mensaje con las instrucciones.*`
  
  await conn.reply(m.chat, message, m, { mentions: [m.sender] })
  
  // Notificar al usuario premium
  try {
    await conn.sendMessage(`${phoneNumber}@s.whatsapp.net`, {
      text: `🎉 *¡FELICIDADES! ERES USUARIO PREMIUM* 🎉

Has sido agregado como *usuario premium* de *${global.botname}*.

*Tus beneficios exclusivos:*
✅ Crear hasta ${global.premiumFeatures.maxSubBots} bots propios
✅ Panel web de control completo
✅ Personalización total (nombre, banner, ícono)
✅ Prefijo personalizable
✅ Reconexión automática 24/7
✅ Anti-eliminación de mensajes
✅ Soporte prioritario

*Para empezar:*
1. Accede al panel: http://localhost:3000
2. Usa tu número como usuario: +${phoneNumber}
3. Crea tu primer bot premium

*Comandos disponibles:*
• ${usedPrefix}crearbot - Crear nuevo bot
• ${usedPrefix}misbots - Ver tus bots
• ${usedPrefix}panel - Acceso al panel web

¡Gracias por tu apoyo! 🚀`
    })
  } catch (e) {
    console.log(chalk.yellow('⚠ No se pudo notificar al usuario:', e.message))
  }
  
  // Enviar sticker de celebración
  try {
    await conn.sendMessage(m.chat, {
      sticker: fs.readFileSync('./lib/stickers/premium.webp')
    }, { quoted: m })
  } catch (e) {
    // Si no existe el sticker, continuar
  }
}

handler.help = ['supprem <número/@usuario>']
handler.tags = ['owner']
handler.command = ['supprem', 'addpremium', 'premiumadd']
handler.rowner = true

export default handler

// ========== SISTEMA DE BOTS PREMIUM ==========

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
  const sessionPath = path.join(__dirname, '../Sessions/Premium', ownerDigits, botDigits)
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
      
      // Aplicar configuración personalizada
      applyPremiumConfig(sock, botConfig.config)
      
      global.savePremiumData()
    }
    
    if (connection === 'close') {
      botConfig.status = 'offline'
      global.savePremiumData()
      
      const reason = lastDisconnect?.error?.output?.statusCode
      
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
    
    // Aquí puedes agregar el handler personalizado del bot
    // Puedes usar tu handler.js adaptado
  })
  
  return sock
}

// Función para aplicar configuración premium
function applyPremiumConfig(sock, config) {
  // Aquí puedes aplicar configuraciones como:
  // - Cambiar nombre de perfil
  // - Cambiar imagen de perfil
  // - Configurar bio
  // - etc.
  
  try {
    if (config.name && sock.user) {
      // sock.updateProfileName(config.name) // Si tu versión de baileys lo soporta
    }
    
    if (config.bio) {
      // sock.updateProfileStatus(config.bio)
    }
  } catch (e) {
    console.error('Error aplicando configuración:', e)
  }
}

// Configurar auto-reconexión
function setupAutoReconnect(sock, botDigits) {
  setInterval(() => {
    if (!sock.user?.id) {
      console.log(chalk.yellow(`🔄 Reintentando conexión para +${botDigits}...`))
      startPremiumBot(botDigits).catch(console.error)
    }
  }, 300000) // Verificar cada 5 minutos
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
  
  // Aplicar cambios a conexión activa
  const activeConn = global.premiumConns.find(conn => 
    conn.botConfig?.phone === botDigits
  )
  
  if (activeConn && activeConn.user?.id) {
    applyPremiumConfig(activeConn, botConfig.config)
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
