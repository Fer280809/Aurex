// plugins/outfit-v2.js - Sistema completo de personalización de grupo

// ===============================
// SISTEMA DE TEMPLATES
// ===============================
const Templates = {
  welcome: {
    simple: `¡Bienvenido {user} al grupo {group}! 👋`,
    fancy: `╔══════════════════╗
║   🎉 BIENVENIDO 🎉   ║
╠══════════════════╣
║ 👤 {user}
║ 👥 {group}
║ 👪 {total} miembros
║ 🕐 {time}
╚══════════════════╝`,
    modern: `┌─────────────────┐
│  🌟 BIENVENIDO  │
├─────────────────┤
│ {user} ha entrado
│ al grupo {group}
│ 
│ 📊 Total: {total}
│ ⏰ Hora: {time}
└─────────────────┘`,
    anime: `(✿◠‿◠)  ¡Bienvenido {user}-sama!
  ╰(*°▽°*)╯   al grupo {group}
  
  Actualmente somos {total} miembros
  ¡Disfruta tu estancia! (๑•̀ㅂ•́)و✧`,
    gamer: `🎮 ¡NUEVO JUGADOR! 🎮
{user} se unió a {group}

🏆 Miembros: {total}
⏱️ Hora: {time}

¡Buena suerte y diviértete!`
  },

  goodbye: {
    simple: `Adiós {user}, te extrañaremos. 👋`,
    fancy: `╔══════════════════╗
║   👋 ADIÓS 👋   ║
╠══════════════════╣
║ 👤 {user}
║ 👥 {group}
║ 👪 {total} miembros
║ 🕐 {time}
╚══════════════════╝`,
    modern: `┌─────────────────┐
│   😢 ADIÓS   │
├─────────────────┤
│ {user} ha salido
│ del grupo {group}
│ 
│ 📊 Total: {total}
│ ⏰ Hora: {time}
└─────────────────┘`,
    anime: `(；ω；)  {user}-sama nos dejó...
  (╥﹏╥)   Te extrañaremos
  
  Ahora somos {total} miembros
  ¡Vuelve pronto! ٩(◕‿◕｡)۶`,
    gamer: `💀 JUGADOR DESCONECTADO 💀
{user} abandonó {group}

🏆 Miembros restantes: {total}
⏱️ Hora: {time}

¡Hasta la próxima partida!`
  }
}

// ===============================
// SISTEMA DE VARIABLES
// ===============================
const Variables = {
  user: (userId) => `@${userId.split('@')[0]}`,
  name: async (userId, conn) => {
    try {
      const contact = await conn.getContact(userId)
      return contact?.name || contact?.pushname || 'Usuario'
    } catch {
      return 'Usuario'
    }
  },
  group: (groupMetadata) => groupMetadata?.subject || 'Grupo',
  total: (participants) => participants?.length || 0,
  time: () => new Date().toLocaleTimeString(),
  date: () => new Date().toLocaleDateString(),
  admins: (participants) => participants?.filter(p => p.admin).length || 0,
  bots: (participants) => participants?.filter(p => p.id.includes('bot')).length || 0,
  owner: (participants) => {
    const owner = participants?.find(p => p.admin === 'superadmin')
    return owner ? `@${owner.id.split('@')[0]}` : 'Desconocido'
  }
}

// ===============================
// CLASE DE GESTIÓN DE CONFIGURACIÓN
// ===============================
class OutfitManager {
  static async getConfig(chatId) {
    const chat = global.db.data.chats[chatId]
    if (!chat.outfit) {
      chat.outfit = {
        welcome: {
          enabled: true,
          template: 'simple',
          custom: null,
          image: null,
          video: null,
          audio: null
        },
        goodbye: {
          enabled: true,
          template: 'simple',
          custom: null,
          image: null,
          video: null,
          audio: null
        },
        variables: {
          useMentions: true,
          useImages: true,
          sendAsSticker: false
        },
        lastUpdated: Date.now()
      }
      await global.db.write()
    }
    return chat.outfit
  }

  static async updateConfig(chatId, updates) {
    const chat = global.db.data.chats[chatId]
    chat.outfit = { ...chat.outfit, ...updates, lastUpdated: Date.now() }
    await global.db.write()
    return chat.outfit
  }

  static async generateMessage(type, userId, conn, groupMetadata) {
    const config = await this.getConfig(groupMetadata.id)
    const typeConfig = config[type]
    
    if (!typeConfig.enabled) return null

    // Obtener participantes
    let participants = []
    try {
      participants = groupMetadata.participants || []
    } catch {
      participants = []
    }

    // Resolver variables
    const vars = {
      user: Variables.user(userId),
      name: await Variables.name(userId, conn),
      group: Variables.group(groupMetadata),
      total: Variables.total(participants),
      time: Variables.time(),
      date: Variables.date(),
      admins: Variables.admins(participants),
      bots: Variables.bots(participants),
      owner: Variables.owner(participants)
    }

    // Usar template personalizado o predeterminado
    let message = typeConfig.custom || Templates[type][typeConfig.template] || Templates[type].simple
    
    // Reemplazar variables
    Object.entries(vars).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{${key}}`, 'gi'), value)
    })

    return {
      text: message,
      mentions: config.variables.useMentions ? [userId] : [],
      config: typeConfig
    }
  }
}

// ===============================
// INTERFAZ DE USUARIO
// ===============================
class OutfitUI {
  static createPanel(title, content, options = {}) {
    const width = options.width || 40
    const lines = []
    
    // Encabezado
    lines.push('┌' + '─'.repeat(width - 2) + '┐')
    lines.push(`│ 🎨 ${title.padEnd(width - 6)} │`)
    lines.push('├' + '─'.repeat(width - 2) + '┤')
    
    // Contenido
    content.split('\n').forEach(line => {
      if (line.trim().startsWith('├') || line.trim().startsWith('└') || line.trim().startsWith('│')) {
        lines.push(line.padEnd(width))
      } else {
        lines.push(`│ ${line.padEnd(width - 4)} │`)
      }
    })
    
    // Pie
    lines.push('└' + '─'.repeat(width - 2) + '┘')
    
    return lines.join('\n')
  }

  static createTemplateButtons(templateType, current, usedPrefix) {
    const templates = Object.keys(Templates[templateType])
    const buttons = []
    
    templates.forEach((template, index) => {
      if (index % 2 === 0) {
        buttons.push([])
      }
      buttons[buttons.length - 1].push({
        buttonId: `${usedPrefix}outfit settemplate ${templateType} ${template}`,
        buttonText: { displayText: template === current ? `⭐ ${template}` : template },
        type: 1
      })
    })
    
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
    return m.reply('⛔ *Solo administradores pueden personalizar el grupo*')
  }

  const config = await OutfitManager.getConfig(m.chat)
  const sub = args[0]?.toLowerCase()

  // ===============================
  // PANEL PRINCIPAL
  // ===============================
  if (!sub) {
    const welcomeStatus = config.welcome.enabled ? '✅ ACTIVADO' : '❌ DESACTIVADO'
    const goodbyeStatus = config.goodbye.enabled ? '✅ ACTIVADO' : '❌ DESACTIVADO'
    
    const panel = OutfitUI.createPanel('OUTFIT PANEL - PERSONALIZACIÓN', `
├─ 🎉 BIENVENIDA: ${welcomeStatus}
│  ├─ Template: ${config.welcome.template}
│  ├─ Personalizado: ${config.welcome.custom ? '✅' : '❌'}
│  └─ Multimedia: ${config.welcome.image || config.welcome.video || config.welcome.audio ? '✅' : '❌'}
│
├─ 👋 DESPEDIDA: ${goodbyeStatus}
│  ├─ Template: ${config.goodbye.template}
│  ├─ Personalizado: ${config.goodbye.custom ? '✅' : '❌'}
│  └─ Multimedia: ${config.goodbye.image || config.goodbye.video || config.goodbye.audio ? '✅' : '❌'}
│
├─ ⚙️ CONFIGURACIÓN:
│  ├─ Menciones: ${config.variables.useMentions ? '✅' : '❌'}
│  ├─ Imágenes: ${config.variables.useImages ? '✅' : '❌'}
│  └─ Stickers: ${config.variables.sendAsSticker ? '✅' : '❌'}
│
├─ 📋 COMANDOS:
│  ├─ ${usedPrefix}outfit welcome - Configurar bienvenida
│  ├─ ${usedPrefix}outfit goodbye - Configurar despedida
│  ├─ ${usedPrefix}outfit test - Probar mensajes
│  ├─ ${usedPrefix}outfit templates - Ver templates
│  ├─ ${usedPrefix}outfit custom - Mensaje personalizado
│  └─ ${usedPrefix}outfit reset - Restablecer
│
└─ 📌 VARIABLES DISPONIBLES:
   {user} {name} {group} {total} {time}
   {date} {admins} {bots} {owner}
    `.trim(), { width: 50 })

    const buttons = [
      [
        { buttonId: `${usedPrefix}outfit welcome`, buttonText: { displayText: '🎉 Welcome' }, type: 1 },
        { buttonId: `${usedPrefix}outfit goodbye`, buttonText: { displayText: '👋 Goodbye' }, type: 1 }
      ],
      [
        { buttonId: `${usedPrefix}outfit test`, buttonText: { displayText: '🧪 Test' }, type: 1 },
        { buttonId: `${usedPrefix}outfit templates`, buttonText: { displayText: '📋 Templates' }, type: 1 }
      ],
      [
        { buttonId: `${usedPrefix}outfit reset`, buttonText: { displayText: '🔄 Reset' }, type: 1 }
      ]
    ]

    await conn.sendMessage(m.chat, {
      text: panel,
      footer: `🎨 Personalización • Grupo: ${groupMetadata.subject}`,
      buttons: buttons,
      headerType: 1
    }, { quoted: m })
    
    return
  }

  // ===============================
  // SUB-COMANDOS
  // ===============================
  switch (sub) {
    case 'welcome':
      await handleWelcomeConfig(m, conn, config, args.slice(1), usedPrefix)
      break
      
    case 'goodbye':
      await handleGoodbyeConfig(m, conn, config, args.slice(1), usedPrefix)
      break
      
    case 'test':
      await handleTestMessages(m, conn, config, groupMetadata)
      break
      
    case 'templates':
      await handleTemplates(m, conn, args.slice(1), usedPrefix)
      break
      
    case 'custom':
      await handleCustomMessage(m, conn, config, args.slice(1))
      break
      
    case 'media':
      await handleMediaConfig(m, conn, config, args.slice(1))
      break
      
    case 'variables':
      await handleVariablesConfig(m, conn, config, args.slice(1))
      break
      
    case 'reset':
      await handleResetConfig(m, conn, config)
      break
      
    case 'preview':
      await handlePreview(m, conn, config, groupMetadata)
      break
      
    case 'help':
      await handleHelp(m, usedPrefix)
      break
      
    default:
      await m.reply(`❌ *Subcomando no reconocido*\nUsa: ${usedPrefix}outfit help`)
  }
}

// ===============================
// MANEJADORES DE CONFIGURACIÓN
// ===============================
async function handleWelcomeConfig(m, conn, config, args, usedPrefix) {
  const action = args[0]?.toLowerCase()
  
  if (!action) {
    const panel = OutfitUI.createPanel('CONFIGURAR BIENVENIDA', `
├─ Estado: ${config.welcome.enabled ? '✅ ACTIVADO' : '❌ DESACTIVADO'}
├─ Template actual: ${config.welcome.template}
├─ Mensaje personalizado: ${config.welcome.custom ? '✅' : '❌'}
├─ Multimedia: ${config.welcome.image || config.welcome.video || config.welcome.audio ? '✅' : '❌'}
│
├─ 📋 COMANDOS:
│  ├─ ${usedPrefix}outfit welcome on/off
│  ├─ ${usedPrefix}outfit welcome template [nombre]
│  ├─ ${usedPrefix}outfit welcome custom [mensaje]
│  ├─ ${usedPrefix}outfit welcome media [imagen/video/audio]
│  └─ ${usedPrefix}outfit welcome clear
│
└─ 🎯 EJEMPLOS:
   ${usedPrefix}outfit welcome on
   ${usedPrefix}outfit welcome template fancy
   ${usedPrefix}outfit welcome custom "¡Hola {user}!"
    `.trim(), { width: 50 })
    
    await m.reply(panel)
    return
  }

  if (action === 'on' || action === 'off') {
    const enabled = action === 'on'
    await OutfitManager.updateConfig(m.chat, {
      welcome: { ...config.welcome, enabled }
    })
    
    await m.reply(`✅ Bienvenida ${enabled ? 'activada' : 'desactivada'}`)
    
  } else if (action === 'template') {
    const templateName = args[1]
    if (!templateName || !Templates.welcome[templateName]) {
      const templates = Object.keys(Templates.welcome).join(', ')
      await m.reply(`❌ *Template no válido*\n\nTemplates disponibles: ${templates}`)
      return
    }
    
    await OutfitManager.updateConfig(m.chat, {
      welcome: { ...config.welcome, template: templateName }
    })
    
    // Mostrar preview
    const preview = Templates.welcome[templateName]
      .replace(/{user}/g, `@${m.sender.split('@')[0]}`)
      .replace(/{group}/g, 'Grupo de Prueba')
      .replace(/{total}/g, '100')
      .replace(/{time}/g, new Date().toLocaleTimeString())
    
    await m.reply(`✅ Template cambiado a: *${templateName}*\n\n📋 Preview:\n${preview}`)
    
  } else if (action === 'custom') {
    const customMessage = args.slice(1).join(' ')
    if (!customMessage) {
      await m.reply(`❌ *Escribe el mensaje personalizado*\n\nEjemplo:\n${usedPrefix}outfit welcome custom "¡Hola {user}!"`)
      return
    }
    
    await OutfitManager.updateConfig(m.chat, {
      welcome: { ...config.welcome, custom: customMessage }
    })
    
    await m.reply(`✅ Mensaje personalizado guardado:\n\n${customMessage}`)
    
  } else if (action === 'clear') {
    await OutfitManager.updateConfig(m.chat, {
      welcome: {
        ...config.welcome,
        custom: null,
        image: null,
        video: null,
        audio: null
      }
    })
    
    await m.reply('✅ Configuración de bienvenida restablecida')
    
  } else {
    await m.reply(`❌ *Acción no reconocida*\nUsa: ${usedPrefix}outfit welcome`)
  }
}

async function handleTestMessages(m, conn, config, groupMetadata) {
  await m.reply('🧪 *Probando mensajes...*')
  
  // Test Welcome
  if (config.welcome.enabled) {
    const welcome = await OutfitManager.generateMessage('welcome', m.sender, conn, groupMetadata)
    if (welcome) {
      const welcomeMsg = welcome.text
        .replace(/{user}/g, `@${m.sender.split('@')[0]}`)
        .replace(/{group}/g, groupMetadata.subject)
        .replace(/{total}/g, participants.length)
      
      await conn.sendMessage(m.chat, {
        text: `🎉 *TEST BIENVENIDA:*\n\n${welcomeMsg}`,
        mentions: [m.sender]
      })
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  // Test Goodbye
  if (config.goodbye.enabled) {
    const goodbye = await OutfitManager.generateMessage('goodbye', m.sender, conn, groupMetadata)
    if (goodbye) {
      const goodbyeMsg = goodbye.text
        .replace(/{user}/g, `@${m.sender.split('@')[0]}`)
        .replace(/{group}/g, groupMetadata.subject)
        .replace(/{total}/g, participants.length - 1)
      
      await conn.sendMessage(m.chat, {
        text: `👋 *TEST DESPEDIDA:*\n\n${goodbyeMsg}`,
        mentions: [m.sender]
      })
    }
  }
  
  await m.reply('✅ *Pruebas completadas*')
}

async function handleTemplates(m, conn, args, usedPrefix) {
  const type = args[0]?.toLowerCase() || 'welcome'
  
  if (!Templates[type]) {
    await m.reply(`❌ *Tipo no válido*\nTipos disponibles: welcome, goodbye`)
    return
  }
  
  const templateList = Object.entries(Templates[type])
    .map(([name, template]) => {
      const preview = template
        .replace(/{user}/g, 'Usuario')
        .replace(/{group}/g, 'Grupo')
        .replace(/{total}/g, '50')
        .replace(/{time}/g, '12:00')
        .split('\n')[0]
        .substring(0, 30) + '...'
      
      return `├─ *${name}*: ${preview}`
    })
    .join('\n')
  
  const panel = OutfitUI.createPanel(`TEMPLATES - ${type.toUpperCase()}`, `
${templateList}
│
├─ 📋 USO:
│  ${usedPrefix}outfit ${type} template [nombre]
│
└─ 🎯 EJEMPLO:
   ${usedPrefix}outfit ${type} template fancy
    `.trim(), { width: 50 })
  
  await m.reply(panel)
}

async function handleResetConfig(m, conn, config) {
  const confirmButtons = [
    [
      { buttonId: `${usedPrefix}outfit confirm_reset`, buttonText: { displayText: '✅ Sí, restablecer' }, type: 1 },
      { buttonId: `${usedPrefix}outfit cancel_reset`, buttonText: { displayText: '❌ No, cancelar' }, type: 1 }
    ]
  ]

  const warning = OutfitUI.createPanel('⚠️ RESTABLECER CONFIGURACIÓN ⚠️', `
🚨 ADVERTENCIA 🚨

Estás a punto de restablecer TODA la personalización:
├─ Templates de bienvenida
├─ Templates de despedida
├─ Mensajes personalizados
├─ Configuración multimedia
└─ Variables personalizadas

❗ ESTA ACCIÓN NO SE PUEDE DESHACER

⏰ Confirma en 1 minuto
    `.trim(), { width: 50 })

  await conn.sendMessage(m.chat, {
    text: warning,
    footer: 'Confirma con los botones',
    buttons: confirmButtons,
    headerType: 1
  }, { quoted: m })
}

// ===============================
// METADATA
// ===============================
handler.command = ['outfit', 'personalizar']
handler.tags = ['group', 'admin', 'config']
handler.group = true
handler.admin = true
handler.botAdmin = true

handler.help = [
  'outfit - Panel de personalización del grupo',
  'outfit welcome - Configurar mensajes de bienvenida',
  'outfit goodbye - Configurar mensajes de despedida',
  'outfit test - Probar mensajes',
  'outfit templates - Ver templates disponibles',
  'outfit custom - Crear mensaje personalizado',
  'outfit reset - Restablecer configuración'
]

export default handler

// Handler para confirmaciones
export const outfitConfirmHandler = async (m, { conn, usedPrefix }) => {
  if (!m.isGroup) return
  
  const text = m.text?.toLowerCase()
  
  if (text === `${usedPrefix}outfit confirm_reset`) {
    const chat = global.db.data.chats[m.chat]
    chat.outfit = {
      welcome: {
        enabled: true,
        template: 'simple',
        custom: null,
        image: null,
        video: null,
        audio: null
      },
      goodbye: {
        enabled: true,
        template: 'simple',
        custom: null,
        image: null,
        video: null,
        audio: null
      },
      variables: {
        useMentions: true,
        useImages: true,
        sendAsSticker: false
      },
      lastUpdated: Date.now()
    }
    
    await global.db.write()
    
    await m.reply(OutfitUI.createPanel('✅ CONFIGURACIÓN RESTABLECIDA', `
Toda la personalización ha sido restablecida a valores por defecto.

📌 CONFIGURACIÓN ACTUAL:
├─ Bienvenida: ✅ Activada (template: simple)
├─ Despedida: ✅ Activada (template: simple)
├─ Menciones: ✅ Activadas
├─ Imágenes: ✅ Activadas
└─ Stickers: ❌ Desactivados

🎨 Usa ${usedPrefix}outfit para personalizar de nuevo
    `.trim(), { width: 50 }))
    
  } else if (text === `${usedPrefix}outfit cancel_reset`) {
    await m.reply('❌ *Restablecimiento cancelado*')
  }
}