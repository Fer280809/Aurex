// plugins/group-config-v2.js
import fs from 'fs/promises'
import path from 'path'

// ===============================
// SISTEMA DE CONFIGURACIÓN
// ===============================
const CONFIG_DIR = './database/group_configs'
const CONFIG_FILE = (chatId) => path.join(CONFIG_DIR, `${chatId.replace('@g.us', '')}.json`)

class GroupConfig {
  static defaults = {
    chatOpen: true,
    allowAdd: true,
    allowEdit: true,
    blockLinks: false,
    blockMedia: false,
    blockCommands: false,
    autoDelete: 'off',
    antiSpam: false,
    antiFlood: { enabled: false, limit: 5, time: 3000 },
    welcome: { enabled: true, type: 'default' },
    rules: { enabled: false, lastShown: 0 },
    silentMode: false,
    timezone: 'America/Mexico_City',
    language: 'es',
    logChannel: null
  }

  static async init() {
    try {
      await fs.mkdir(CONFIG_DIR, { recursive: true })
    } catch (error) {
      console.error('Error inicializando directorio:', error)
    }
  }

  static async get(chatId) {
    try {
      const filePath = CONFIG_FILE(chatId)
      const data = await fs.readFile(filePath, 'utf-8')
      return { ...this.defaults, ...JSON.parse(data) }
    } catch (error) {
      return { ...this.defaults }
    }
  }

  static async set(chatId, updates) {
    try {
      const current = await this.get(chatId)
      const updated = { ...current, ...updates, updatedAt: Date.now() }
      
      await fs.writeFile(
        CONFIG_FILE(chatId),
        JSON.stringify(updated, null, 2),
        'utf-8'
      )
      
      return updated
    } catch (error) {
      console.error('Error guardando configuración:', error)
      throw error
    }
  }

  static async delete(chatId) {
    try {
      await fs.unlink(CONFIG_FILE(chatId))
    } catch (error) {
      // Archivo no existe, ignorar
    }
  }
}

// Inicializar al cargar
await GroupConfig.init()

// ===============================
// UTILIDADES DE INTERFAZ
// ===============================
class UIUtils {
  static createPanel(title, content, options = {}) {
    const width = options.width || 40
    const border = options.border || '═'
    const corner = options.corner || '╔╗╚╝'
    const [tl, tr, bl, br] = corner.split('')
    
    const lines = [
      tl + border.repeat(width - 2) + tr,
      `║  🏷️  ${title.padEnd(width - 10)}  ║`,
      `║${' '.repeat(width)}║`
    ]
    
    content.split('\n').forEach(line => {
      if (line.trim()) {
        lines.push(`║  ${line.padEnd(width - 6)}  ║`)
      } else {
        lines.push(`║${' '.repeat(width)}║`)
      }
    })
    
    lines.push(`║${' '.repeat(width)}║`)
    lines.push(bl + border.repeat(width - 2) + br)
    
    return lines.join('\n')
  }

  static formatBoolean(value, trueText = '✅ ON', falseText = '❌ OFF') {
    return value ? trueText : falseText
  }

  static formatTime(seconds) {
    if (seconds === 0) return 'Desactivado'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (mins > 0) parts.push(`${mins}m`)
    
    return parts.join(' ') || `${seconds}s`
  }

  static async createConfigButtons(config, usedPrefix) {
    const buttons = [
      {
        buttonId: `${usedPrefix}gconfig chat`,
        buttonText: { displayText: config.chatOpen ? '🔒 Cerrar Chat' : '🔓 Abrir Chat' },
        type: 1
      },
      {
        buttonId: `${usedPrefix}gconfig links`,
        buttonText: { displayText: config.blockLinks ? '🔗 Permitir Links' : '🚫 Bloquear Links' },
        type: 1
      },
      {
        buttonId: `${usedPrefix}gconfig autodel`,
        buttonText: { displayText: '⏰ AutoDelete' },
        type: 1
      },
      {
        buttonId: `${usedPrefix}gconfig welcome`,
        buttonText: { displayText: config.welcome.enabled ? '🎉 Sin Welcome' : '🎉 Con Welcome' },
        type: 1
      },
      {
        buttonId: `${usedPrefix}gconfig antispam`,
        buttonText: { displayText: config.antiSpam ? '🚫 Sin AntiSpam' : '🚫 Con AntiSpam' },
        type: 1
      },
      {
        buttonId: `${usedPrefix}gconfig reset`,
        buttonText: { displayText: '🔄 Restablecer' },
        type: 1
      }
    ]

    return buttons
  }
}

// ===============================
// HANDLER PRINCIPAL
// ===============================
const handler = async (m, {
  conn,
  args,
  usedPrefix,
  command,
  participants,
  groupMetadata,
  isAdmin,
  isOwner,
  isBotAdmin
}) => {
  // ===============================
  // VALIDACIONES
  // ===============================
  if (!m.isGroup) {
    return m.reply('🚫 *Este comando solo funciona en grupos*')
  }

  if (!isAdmin && !isOwner) {
    return m.reply('⛔ *Solo administradores pueden configurar el grupo*')
  }

  if (!isBotAdmin) {
    return m.reply('🤖 *Necesito ser administrador para cambiar configuraciones*')
  }

  const config = await GroupConfig.get(m.chat)
  const subCommand = args[0]?.toLowerCase()

  // ===============================
  // PANEL PRINCIPAL
  // ===============================
  if (!subCommand || subCommand === 'panel') {
    const configSummary = `
🔧 CONFIGURACIÓN ACTUAL:
├─ 🗨️  Chat: ${UIUtils.formatBoolean(config.chatOpen, '🔓 Abierto', '🔒 Cerrado')}
├─ ➕  Añadir usuarios: ${UIUtils.formatBoolean(config.allowAdd)}
├─ 📝  Editar grupo: ${UIUtils.formatBoolean(config.allowEdit)}
├─ 🔗  Links: ${UIUtils.formatBoolean(!config.blockLinks, '✅ Permitidos', '🚫 Bloqueados')}
├─ 🎨  Media: ${UIUtils.formatBoolean(!config.blockMedia, '✅ Permitida', '🚫 Bloqueada')}
├─ ⚡  Comandos: ${UIUtils.formatBoolean(!config.blockCommands, '✅ Permitidos', '🚫 Bloqueados')}
├─ ⏰  AutoDelete: ${config.autoDelete === 'off' ? '❌ OFF' : `✅ ${config.autoDelete}`}
├─ 🚫  AntiSpam: ${UIUtils.formatBoolean(config.antiSpam)}
├─ 🌊  AntiFlood: ${UIUtils.formatBoolean(config.antiFlood.enabled)}
├─ 🎉  Welcome: ${UIUtils.formatBoolean(config.welcome.enabled)}
├─ 📜  Reglas: ${UIUtils.formatBoolean(config.rules.enabled)}
├─ 🔕  Modo silencioso: ${UIUtils.formatBoolean(config.silentMode)}
├─ 🌐  Idioma: ${config.language.toUpperCase()}
└─ ⏰  Zona horaria: ${config.timezone}

📌 USO:
• ${usedPrefix}gconfig [opción] [valor]
• ${usedPrefix}gconfig chat on/off
• ${usedPrefix}gconfig links on/off
• ${usedPrefix}gconfig autodel 24h/7d/off
• ${usedPrefix}gconfig welcome on/off
• ${usedPrefix}gconfig reset - Restablecer todo

🔄 CAMBIOS EN TIEMPO REAL:
Los cambios se aplican inmediatamente
    `.trim()

    const panel = UIUtils.createPanel('CONFIGURACIÓN DE GRUPO', configSummary, { width: 45 })
    
    const buttons = await UIUtils.createConfigButtons(config, usedPrefix)

    await conn.sendMessage(m.chat, {
      text: panel,
      footer: `⚙️ ${groupMetadata.subject} • 👑 Administrador: @${m.sender.split('@')[0]}`,
      buttons,
      headerType: 1,
      mentions: [m.sender]
    }, { quoted: m })
    
    return
  }

  // ===============================
  // SUB-COMANDOS
  // ===============================
  const value = args[1]?.toLowerCase()

  switch (subCommand) {
    case 'chat':
      await handleChatConfig(m, conn, config, value, groupMetadata)
      break
      
    case 'links':
      await handleLinksConfig(m, conn, config, value)
      break
      
    case 'media':
      await handleMediaConfig(m, conn, config, value)
      break
      
    case 'commands':
      await handleCommandsConfig(m, conn, config, value)
      break
      
    case 'autodel':
      await handleAutoDeleteConfig(m, conn, config, value)
      break
      
    case 'antispam':
      await handleAntiSpamConfig(m, conn, config, value)
      break
      
    case 'antiflood':
      await handleAntiFloodConfig(m, conn, config, value)
      break
      
    case 'welcome':
      await handleWelcomeConfig(m, conn, config, value)
      break
      
    case 'rules':
      await handleRulesConfig(m, conn, config, value)
      break
      
    case 'silent':
      await handleSilentConfig(m, conn, config, value)
      break
      
    case 'language':
      await handleLanguageConfig(m, conn, config, value)
      break
      
    case 'timezone':
      await handleTimezoneConfig(m, conn, config, value)
      break
      
    case 'reset':
      await handleResetConfig(m, conn, config)
      break
      
    case 'backup':
      await handleBackupConfig(m, conn, config)
      break
      
    case 'import':
      await handleImportConfig(m, conn, args.slice(1).join(' '))
      break
      
    default:
      await m.reply(`❌ *Opción inválida*\n\nUsa: ${usedPrefix}gconfig panel para ver todas las opciones`)
  }
}

// ===============================
// MANEJADORES DE CONFIGURACIÓN
// ===============================
async function handleChatConfig(m, conn, config, value, groupMetadata) {
  const newValue = value === 'on' || value === 'open' || value === 'true'
  
  try {
    await conn.groupSettingUpdate(
      m.chat,
      newValue ? 'not_announcement' : 'announcement'
    )
    
    const updated = await GroupConfig.set(m.chat, { chatOpen: newValue })
    
    const status = newValue ? '🔓 ABIERTO' : '🔒 CERRADO'
    const message = UIUtils.createPanel('CONFIGURACIÓN DE CHAT', `
El chat ahora está ${status}

📌 DETALLES:
├─ Estado: ${UIUtils.formatBoolean(newValue, '✅ Abierto', '❌ Cerrado')}
├─ Cambiado por: @${m.sender.split('@')[0]}
├─ Grupo: ${groupMetadata.subject}
└─ Hora: ${new Date().toLocaleTimeString()}

${newValue ? 
  '✅ Todos pueden enviar mensajes' : 
  '⚠️ Solo administradores pueden enviar mensajes'}
    `.trim(), { width: 45 })
    
    await m.reply(message, { mentions: [m.sender] })
    
  } catch (error) {
    console.error('Error cambiando configuración de chat:', error)
    await m.reply('❌ *Error al cambiar configuración*')
  }
}

async function handleLinksConfig(m, conn, config, value) {
  const newValue = value === 'on' || value === 'block' || value === 'true'
  const updated = await GroupConfig.set(m.chat, { blockLinks: newValue })
  
  const message = UIUtils.createPanel('CONFIGURACIÓN DE LINKS', `
Los enlaces ahora están ${newValue ? '🚫 BLOQUEADOS' : '✅ PERMITIDOS'}

📌 DETALLES:
├─ Estado: ${UIUtils.formatBoolean(!newValue, '✅ Permitidos', '🚫 Bloqueados')}
├─ Tipo: ${newValue ? 'Anti-Link activado' : 'Anti-Link desactivado'}
├─ Cambiado por: @${m.sender.split('@')[0]}
└─ Hora: ${new Date().toLocaleTimeString()}

${newValue ? 
  '⚠️ Los usuarios que envíen links serán advertidos/expulsados' : 
  '✅ Los usuarios pueden compartir links libremente'}
    `.trim(), { width: 45 })
    
  await m.reply(message, { mentions: [m.sender] })
}

async function handleAutoDeleteConfig(m, conn, config, value) {
  const options = {
    'off': { name: 'Desactivado', seconds: 0 },
    '30m': { name: '30 Minutos', seconds: 1800 },
    '1h': { name: '1 Hora', seconds: 3600 },
    '6h': { name: '6 Horas', seconds: 21600 },
    '12h': { name: '12 Horas', seconds: 43200 },
    '24h': { name: '24 Horas', seconds: 86400 },
    '7d': { name: '7 Días', seconds: 604800 },
    '90d': { name: '90 Días', seconds: 7776000 }
  }

  if (!value || !options[value]) {
    const optionsList = Object.keys(options).map(k => `• ${k} - ${options[k].name}`).join('\n')
    const message = UIUtils.createPanel('AUTODELETE - OPCIONES', `
Selecciona una opción:

${optionsList}

📌 USO:
${usedPrefix}gconfig autodel [opción]

Ejemplo:
${usedPrefix}gconfig autodel 24h
    `.trim(), { width: 45 })
    
    return await m.reply(message)
  }

  const selected = options[value]
  const updated = await GroupConfig.set(m.chat, { autoDelete: value })
  
  try {
    if (selected.seconds > 0) {
      await conn.sendMessage(m.chat, {
        disappearingMessagesInChat: selected.seconds
      })
    } else {
      await conn.sendMessage(m.chat, {
        disappearingMessagesInChat: false
      })
    }
  } catch (error) {
    console.error('Error configurando auto-delete:', error)
  }

  const message = UIUtils.createPanel('CONFIGURACIÓN AUTODELETE', `
AutoDelete configurado a: ${selected.name}

📌 DETALLES:
├─ Duración: ${selected.name}
├─ Segundos: ${selected.seconds}
├─ Cambiado por: @${m.sender.split('@')[0]}
└─ Hora: ${new Date().toLocaleTimeString()}

${selected.seconds > 0 ? 
  '✅ Los mensajes se auto-eliminarán después del tiempo configurado' : 
  '❌ Los mensajes no se auto-eliminarán'}
    `.trim(), { width: 45 })
    
  await m.reply(message, { mentions: [m.sender] })
}

async function handleWelcomeConfig(m, conn, config, value) {
  const newValue = value === 'on' || value === 'enable' || value === 'true'
  const updated = await GroupConfig.set(m.chat, { 
    welcome: { 
      ...config.welcome, 
      enabled: newValue 
    } 
  })
  
  const message = UIUtils.createPanel('CONFIGURACIÓN WELCOME', `
Welcome ${newValue ? '✅ ACTIVADO' : '❌ DESACTIVADO'}

📌 DETALLES:
├─ Estado: ${UIUtils.formatBoolean(newValue)}
├─ Tipo: ${config.welcome.type}
├─ Cambiado por: @${m.sender.split('@')[0]}
└─ Hora: ${new Date().toLocaleTimeString()}

${newValue ? 
  '🎉 Los nuevos miembros recibirán mensaje de bienvenida' : 
  '🤫 Los nuevos miembros no recibirán mensaje de bienvenida'}
    `.trim(), { width: 45 })
    
  await m.reply(message, { mentions: [m.sender] })
}

async function handleAntiSpamConfig(m, conn, config, value) {
  const newValue = value === 'on' || value === 'enable' || value === 'true'
  const updated = await GroupConfig.set(m.chat, { antiSpam: newValue })
  
  const message = UIUtils.createPanel('CONFIGURACIÓN ANTISPAM', `
Anti-Spam ${newValue ? '✅ ACTIVADO' : '❌ DESACTIVADO'}

📌 DETALLES:
├─ Estado: ${UIUtils.formatBoolean(newValue)}
├─ Cambiado por: @${m.sender.split('@')[0]}
├─ Grupo: ${m.chat}
└─ Hora: ${new Date().toLocaleTimeString()}

${newValue ? 
  '🚫 Se detectarán y sancionarán mensajes spam' : 
  '✅ No se detectará spam automáticamente'}
    `.trim(), { width: 45 })
    
  await m.reply(message, { mentions: [m.sender] })
}

async function handleResetConfig(m, conn, config) {
  const confirmButtons = [
    {
      buttonId: `${usedPrefix}gconfig confirm_reset`,
      buttonText: { displayText: '✅ Sí, restablecer' },
      type: 1
    },
    {
      buttonId: `${usedPrefix}gconfig cancel_reset`,
      buttonText: { displayText: '❌ No, cancelar' },
      type: 1
    }
  ]

  const warning = UIUtils.createPanel('⚠️ RESTABLECER CONFIGURACIÓN ⚠️', `
🚨 ADVERTENCIA CRÍTICA 🚨

Estás a punto de RESTABLECER TODA la configuración del grupo a valores por defecto.

📌 SE PERDERÁN:
├─ Todas las configuraciones personalizadas
├─ Reglas personalizadas
├─ Configuración de bienvenida
├─ Filtros de spam
└─ Preferencias de idioma/horario

❗ ESTA ACCIÓN NO SE PUEDE DESHACER

⏰ Tienes 1 minuto para confirmar
    `.trim(), { width: 45 })

  await conn.sendMessage(m.chat, {
    text: warning,
    footer: 'Confirma la acción con los botones',
    buttons: confirmButtons,
    headerType: 1
  }, { quoted: m })
}

// ===============================
// METADATA
// ===============================
handler.command = ['gconfig', 'groupconfig', 'configgroup']
handler.tags = ['admin', 'group', 'config']
handler.group = true
handler.admin = true
handler.botAdmin = true

handler.help = [
  'gconfig - Panel de configuración del grupo',
  'gconfig chat [on/off] - Abrir/cerrar chat',
  'gconfig links [on/off] - Permitir/bloquear links',
  'gconfig autodel [tiempo] - Configurar auto-eliminación',
  'gconfig welcome [on/off] - Activar/desactivar bienvenida',
  'gconfig antispam [on/off] - Anti-spam',
  'gconfig reset - Restablecer configuración',
  'gconfig backup - Crear backup',
  'gconfig import [json] - Importar configuración'
]

export default handler

// Handler para confirmaciones
export const configHandler = async (m, { conn, usedPrefix }) => {
  if (!m.isGroup) return
  
  const text = m.text?.toLowerCase()
  
  if (text === `${usedPrefix}gconfig confirm_reset`) {
    await GroupConfig.delete(m.chat)
    
    const message = UIUtils.createPanel('✅ CONFIGURACIÓN RESTABLECIDA', `
Toda la configuración ha sido restablecida a valores por defecto.

📌 DETALLES:
├─ Acción: Restablecimiento completo
├─ Por: @${m.sender.split('@')[0]}
├─ Grupo: ${m.chat}
└─ Hora: ${new Date().toLocaleString()}

🔄 El grupo ahora usa configuración por defecto
📝 Usa ${usedPrefix}gconfig para personalizar de nuevo
    `.trim(), { width: 45 })
    
    await m.reply(message, { mentions: [m.sender] })
    
  } else if (text === `${usedPrefix}gconfig cancel_reset`) {
    await m.reply('❌ *Restablecimiento cancelado*')
  }
}