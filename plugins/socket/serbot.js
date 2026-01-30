import { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from "@whiskeysockets/baileys"
import qrcode from "qrcode"
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import util from 'util'
import * as ws from 'ws'
import { spawn } from 'child_process'
import { makeWASocket } from '../../lib/simple.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============= CONFIGURACIÓN =============
const IMG_SUB = 'https://files.catbox.moe/gptlxc.jpg'
const QR_TEXTS = {
  qr: `╭─〔 💻 ᴀsᴛᴀ ʙᴏᴛ • ᴍᴏᴅᴏ ǫʀ 〕─╮
│ 📲 Escanea este *QR* para ser *Sub-Bot*
│ ⏳ *Expira en 45 segundos*
╰───────────────────────`,
  
  code: `╭─[ 💻 ᴀsᴛᴀ ʙᴏᴛ • ᴍᴏᴅᴇ ᴄᴏᴅᴇ ]─╮
│ 🧠 *Modo CODE* - Escanea desde otro dispositivo
│ ⏳ *Expira en 45 segundos*
╰────────────────────────╯`
}

// ============= INICIALIZACIÓN =============
if (!global.conns) global.conns = []
if (!global.subBotsData) global.subBotsData = new Map()

// ============= FUNCIONES AUXILIARES =============
const sleep = ms => new Promise(r => setTimeout(r, ms))
const msToTime = ms => {
  let minutes = Math.floor((ms / 1000 / 60) % 60)
  let seconds = Math.floor((ms / 1000) % 60)
  return `${minutes}m ${seconds}s`
}

// ============= HANDLER PRINCIPAL =============
let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
  // Verificar si está activado
  if (!global.db.data?.settings?.[conn.user.jid]?.jadibotmd) {
    return m.reply(`❌ El comando *${command}* está desactivado.`)
  }

  // Cooldown
  const userCooldown = global.db.data.users[m.sender]?.Subs || 0
  const cooldownTime = global.supConfig.cooldown * 1000
  if (Date.now() - userCooldown < cooldownTime) {
    return m.reply(`⏳ Espera ${msToTime(cooldownTime - (Date.now() - userCooldown))} para otro Sub-Bot.`)
  }

  // Límite de subs
  const activeSubs = global.conns.filter(c => c?.user).length
  if (activeSubs >= global.supConfig.maxSubBots) {
    return m.reply(`🚫 Límite de *${global.supConfig.maxSubBots}* Sub-Bots alcanzado.`)
  }

  // Crear sesión
  const senderId = m.sender.split('@')[0]
  const sessionPath = path.join(global.jadi, senderId)
  
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true })
  }

  // Ejecutar AstaJadiBot
  await AstaJadiBot({
    pathAstaJadiBot: sessionPath,
    m, conn, args, usedPrefix, command,
    fromCommand: true
  })

  // Actualizar cooldown
  if (global.db.data.users[m.sender]) {
    global.db.data.users[m.sender].Subs = Date.now()
  }
}

handler.help = ['qr', 'code']
handler.tags = ['serbot']
handler.command = ['qr', 'code']
export default handler

// ============= SISTEMA DE SUBS OPTIMIZADO =============
export async function AstaJadiBot(options) {
  const { pathAstaJadiBot, m, conn, args, usedPrefix, command } = options
  
  // Modo code o QR
  const isCodeMode = args.some(arg => /^(--code|code)$/i.test(arg))
  const cleanArgs = args.filter(arg => !/^(--code|code)$/i.test(arg))
  
  // Crear sesión
  const { state, saveCreds } = await useMultiFileAuthState(pathAstaJadiBot)
  const { version } = await fetchLatestBaileysVersion()
  
  const connectionOptions = {
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: ['Asta Bot', 'Chrome', '1.0.0'],
    version,
    generateHighQualityLinkPreview: true,
    msgRetryCounterCache: new NodeCache(),
  }
  
  const sock = makeWASocket(connectionOptions)
  sock.sessionPath = pathAstaJadiBot
  sock.owner = m.sender
  
  // Configuración personalizada del SubBot
  const subConfigPath = path.join(pathAstaJadiBot, 'config.json')
  if (!fs.existsSync(subConfigPath)) {
    const defaultConfig = {
      name: `SubBot ${m.sender.split('@')[0]}`,
      icon: global.icono,
      banner: global.banner,
      prefix: global.prefix,
      createdAt: new Date().toISOString(),
      owner: m.sender
    }
    fs.writeFileSync(subConfigPath, JSON.stringify(defaultConfig, null, 2))
  }
  
  sock.subConfig = JSON.parse(fs.readFileSync(subConfigPath, 'utf-8'))
  
  // Almacenar en memoria para rápido acceso
  global.subBotsData.set(sock.user?.jid || pathAstaJadiBot, {
    config: sock.subConfig,
    owner: m.sender,
    createdAt: Date.now()
  })
  
  // Manejo de conexión
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    
    if (qr) {
      if (isCodeMode) {
        const code = await sock.requestPairingCode(m.sender.split('@')[0])
        const formattedCode = code.match(/.{1,4}/g)?.join('-')
        
        await conn.sendMessage(m.chat, {
          image: { url: IMG_SUB },
          caption: QR_TEXTS.code
        }, { quoted: m })
        
        const codeMsg = await m.reply(`*Código:* ${formattedCode}`)
        setTimeout(() => conn.sendMessage(m.sender, { delete: codeMsg.key }), 45000)
      } else {
        const qrImage = await qrcode.toBuffer(qr, { scale: 8 })
        const qrMsg = await conn.sendMessage(m.chat, {
          image: qrImage,
          caption: QR_TEXTS.qr
        }, { quoted: m })
        
        setTimeout(() => conn.sendMessage(m.sender, { delete: qrMsg.key }), 45000)
      }
    }
    
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      
      // Limpiar si hay error
      if ([401, 403, 405, 500].includes(statusCode)) {
        cleanSession(sock)
      }
      
      // Reconectar automáticamente
      if ([408, 428, 440, 515].includes(statusCode)) {
        setTimeout(() => AstaJadiBot(options), 5000)
      }
    }
    
    if (connection === 'open') {
      console.log(chalk.green(`✅ SubBot conectado: ${sock.user?.jid || 'Unknown'}`))
      global.conns.push(sock)
      
      // Enviar mensaje de confirmación
      const userName = sock.user?.name || sock.subConfig.name
      await conn.sendMessage(m.chat, {
        text: `✨ *SubBot Conectado*\n\n👤 *Nombre:* ${userName}\n🔗 *ID:* ${sock.user?.jid}\n✅ Listo para usar comandos.`
      }, { quoted: m })
    }
  })
  
  // Cargar handler
  const loadHandler = async () => {
    try {
      const handlerModule = await import('../../handler.js')
      sock.ev.on('messages.upsert', handlerModule.handler.bind(sock))
    } catch (e) {
      console.error('Error cargando handler:', e)
    }
  }
  
  await loadHandler()
  
  // Limpieza automática
  setTimeout(() => {
    if (!sock.user) {
      cleanSession(sock)
    }
  }, 60000)
  
  return sock
}

// ============= FUNCIÓN DE LIMPIEZA =============
function cleanSession(sock) {
  if (!sock) return
  
  try {
    // Cerrar conexión
    if (sock.ws && sock.ws.readyState !== ws.CLOSED) {
      sock.ws.close()
    }
    
    // Remover listeners
    sock.ev.removeAllListeners()
    
    // Remover de conns
    const index = global.conns.indexOf(sock)
    if (index > -1) global.conns.splice(index, 1)
    
    // Remover de memoria
    if (sock.user?.jid) {
      global.subBotsData.delete(sock.user.jid)
    }
    
    // Eliminar archivos si no hay usuario
    if (!sock.user && sock.sessionPath && fs.existsSync(sock.sessionPath)) {
      fs.rmSync(sock.sessionPath, { recursive: true, force: true })
    }
    
    console.log(chalk.yellow(`🧹 Sesión limpiada: ${sock.user?.jid || 'Unknown'}`))
  } catch (e) {
    console.error('Error limpiando sesión:', e)
  }
}