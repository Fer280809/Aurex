// plugins/admin-panel.js
import { areJidsSameUser } from '@whiskeysockets/baileys'

// ===============================
// CONFIGURACIÓN GLOBAL
// ===============================
global.adminCooldowns = global.adminCooldowns || new Map()
global.pendingActions = global.pendingActions || new Map()
const COOLDOWN_TIME = 10000 // 10 segundos
const MAX_MASS_KICK = 20 // Límite de seguridad

// ===============================
// UTILIDADES MEJORADAS
// ===============================
class AdminUtils {
  static isOnCooldown(userId, command) {
    const key = `${userId}:${command}`
    const now = Date.now()
    
    if (global.adminCooldowns.has(key)) {
      const lastTime = global.adminCooldowns.get(key)
      if (now - lastTime < COOLDOWN_TIME) {
        return Math.ceil((COOLDOWN_TIME - (now - lastTime)) / 1000)
      }
    }
    
    global.adminCooldowns.set(key, now)
    setTimeout(() => global.adminCooldowns.delete(key), COOLDOWN_TIME + 1000)
    return false
  }

  static async getTargetUser(m, args, participants) {
    // 1. Mención directa
    if (m.mentionedJid?.[0]) {
      return m.mentionedJid[0]
    }
    
    // 2. Mensaje citado
    if (m.quoted?.sender) {
      return m.quoted.sender
    }
    
    // 3. Número proporcionado
    if (args[0]) {
      const num = args[0].replace(/\D/g, '')
      if (num) {
        const jid = num + '@s.whatsapp.net'
        // Verificar si el usuario está en el grupo
        const inGroup = participants.some(p => areJidsSameUser(p.id, jid))
        return inGroup ? jid : null
      }
    }
    
    return null
  }

  static formatBox(title, content) {
    const topLine = '╭' + '─'.repeat(title.length + 6) + '╮'
    const bottomLine = '╰' + '─'.repeat(title.length + 6) + '╯'
    
    return `${topLine}
│  📌 ${title}  │
│${' '.repeat(title.length + 8)}│
${content.split('\n').map(line => `│  ${line.padEnd(title.length + 4)}  │`).join('\n')}
│${' '.repeat(title.length + 8)}│
${bottomLine}`
  }

  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static formatUserList(users, max = 5) {
    if (!users.length) return '│  ⚠️  Sin usuarios  ⚠️  │'
    
    const limited = users.slice(0, max)
    return limited.map((user, i) => {
      const num = user.split('@')[0]
      return `│  ${i + 1}. ${num.slice(-8).padStart(8, '•')}  │`
    }).join('\n') + (users.length > max ? `\n│  ... y ${users.length - max} más  │` : '')
  }
}

// ===============================
// MANEJO DE ACCIONES PENDIENTES
// ===============================
class PendingActionManager {
  static setAction(userId, action) {
    global.pendingActions.set(userId, {
      ...action,
      timestamp: Date.now()
    })
    
    // Auto-limpiar después de 2 minutos
    setTimeout(() => {
      if (global.pendingActions.get(userId)?.id === action.id) {
        global.pendingActions.delete(userId)
      }
    }, 120000)
  }

  static getAction(userId) {
    const action = global.pendingActions.get(userId)
    if (!action) return null
    
    if (Date.now() - action.timestamp > 120000) {
      global.pendingActions.delete(userId)
      return null
    }
    
    return action
  }

  static clearAction(userId) {
    global.pendingActions.delete(userId)
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
  // VALIDACIONES INICIALES
  // ===============================
  if (!m.isGroup) {
    return m.reply('🚫 *Este comando solo funciona en grupos*')
  }

  if (!isAdmin && !isOwner) {
    return m.reply('⛔ *Solo administradores pueden usar este comando*')
  }

  if (!isBotAdmin) {
    return m.reply('🤖 *Necesito ser administrador para ejecutar estas acciones*')
  }

  // ===============================
  // PROCESAR ACCIONES PENDIENTES
  // ===============================
  const pendingAction = PendingActionManager.getAction(m.sender)
  if (pendingAction) {
    switch (pendingAction.type) {
      case 'add_user':
        await handleAddUserResponse(m, conn, pendingAction)
        return
        
      case 'mass_kick_confirm':
        await handleMassKickConfirm(m, conn, pendingAction)
        return
        
      case 'custom_message':
        await handleCustomMessage(m, conn, pendingAction)
        return
    }
  }

  // ===============================
  // PANEL PRINCIPAL
  // ===============================
  if (command === 'adminpanel' || command === 'ap') {
    const cooldown = AdminUtils.isOnCooldown(m.sender, 'panel')
    if (cooldown) {
      return m.reply(`⏳ *Espera ${cooldown} segundos* antes de usar el panel nuevamente`)
    }

    const menuContent = AdminUtils.formatBox('PANEL DE ADMINISTRACIÓN', `│
│  🔧  GESTIÓN DE USUARIOS  🔧
│
│  ➕  Añadir usuario
│     » ${usedPrefix}add @user
│     » ${usedPrefix}add 521xxxxxxxx
│
│  🚫  Expulsar usuario
│     » ${usedPrefix}kick @user
│     » ${usedPrefix}kick (responde)
│
│  ⬆️  Hacer administrador
│     » ${usedPrefix}promote @user
│
│  ⬇️  Quitar administrador
│     » ${usedPrefix}demote @user
│
│  💥  Expulsión masiva
│     » ${usedPrefix}masskick
│
│  📊  Estadísticas
│     » ${usedPrefix}groupinfo
│
│  ⚙️  Configuración
│     » ${usedPrefix}groupconfig
│`)

    const buttons = [
      {
        buttonId: `${usedPrefix}add`,
        buttonText: { displayText: '➕ Añadir' },
        type: 1
      },
      {
        buttonId: `${usedPrefix}groupinfo`,
        buttonText: { displayText: '📊 Info' },
        type: 1
      },
      {
        buttonId: `${usedPrefix}masskick`,
        buttonText: { displayText: '💥 MassKick' },
        type: 1
      }
    ]

    await conn.sendMessage(m.chat, {
      text: menuContent,
      footer: `👑 Total: ${participants.length} miembros • 🤖 Bot: ${isBotAdmin ? '✅ Admin' : '❌ No admin'}`,
      buttons: buttons,
      headerType: 1,
      mentions: [m.sender]
    }, { quoted: m })
    return
  }

  // ===============================
  // AÑADIR USUARIO
  // ===============================
  if (command === 'add') {
    const cooldown = AdminUtils.isOnCooldown(m.sender, 'add')
    if (cooldown) {
      return m.reply(`⏳ *Espera ${cooldown} segundos*`)
    }

    PendingActionManager.setAction(m.sender, {
      id: 'add_user_' + Date.now(),
      type: 'add_user',
      chat: m.chat,
      admin: m.sender
    })

    const instructions = AdminUtils.formatBox('AÑADIR USUARIO', `│
│  📱  Envía el número de WhatsApp:
│
│  Ejemplos:
│  • 5213312345678
│  • 3312345678
│  • +5213312345678
│
│  ⏱️  Tienes 2 minutos
│  ❌  Escribe "cancelar" para cancelar
│`)

    await m.reply(instructions)
    return
  }

  // ===============================
  // EXPULSAR USUARIO
  // ===============================
  if (command === 'kick') {
    const cooldown = AdminUtils.isOnCooldown(m.sender, 'kick')
    if (cooldown) {
      return m.reply(`⏳ *Espera ${cooldown} segundos*`)
    }

    const target = await AdminUtils.getTargetUser(m, args, participants)
    if (!target) {
      return m.reply(AdminUtils.formatBox('EXPULSAR USUARIO', `│
│  📌  Uso correcto:
│
│  1. Menciona al usuario:
│     » ${usedPrefix}kick @usuario
│
│  2. Responde un mensaje:
│     » ${usedPrefix}kick (responde)
│
│  3. Usa número:
│     » ${usedPrefix}kick 521xxxxxxx
│`))
    }

    // No permitir expulsar a otros admins (a menos que sea owner)
    const targetIsAdmin = participants.find(p => areJidsSameUser(p.id, target))?.admin
    if (targetIsAdmin && !isOwner) {
      return m.reply('⛔ *No puedes expulsar a otro administrador*')
    }

    // No permitir expulsar al bot
    if (areJidsSameUser(target, conn.user.jid)) {
      return m.reply('🤖 *No puedes expulsarme a mí*')
    }

    try {
      await conn.groupParticipantsUpdate(m.chat, [target], 'remove')
      
      const targetNum = target.split('@')[0]
      await m.reply(AdminUtils.formatBox('USUARIO EXPULSADO', `│
│  ✅  Acción completada
│
│  👤  Usuario: ${targetNum}
│  🚫  Motivo: Expulsión manual
│  👑  Por: @${m.sender.split('@')[0]}
│  ⏰  Hora: ${new Date().toLocaleTimeString()}
│`))
      
      // Notificar al usuario expulsado si es posible
      try {
        await conn.sendMessage(target, {
          text: `🚫 *Has sido expulsado del grupo*\n\n• Grupo: ${groupMetadata.subject}\n• Administrador: @${m.sender.split('@')[0]}\n• Hora: ${new Date().toLocaleString()}`
        })
      } catch (e) {
        // Ignorar si no se puede enviar mensaje
      }
      
    } catch (error) {
      console.error('Error en kick:', error)
      await m.reply('❌ *Error al expulsar usuario*')
    }
    return
  }

  // ===============================
  // ASCENDER A ADMIN
  // ===============================
  if (command === 'promote') {
    const target = await AdminUtils.getTargetUser(m, args, participants)
    if (!target) {
      return m.reply(AdminUtils.formatBox('ASCENDER A ADMIN', `│
│  📌  Uso correcto:
│
│  ${usedPrefix}promote @usuario
│  ${usedPrefix}promote (responde)
│`))
    }

    try {
      await conn.groupParticipantsUpdate(m.chat, [target], 'promote')
      
      await m.reply(AdminUtils.formatBox('NUEVO ADMINISTRADOR', `│
│  ⭐  Usuario ascendido
│
│  👤  @${target.split('@')[0]}
│  ⬆️  Ahora es administrador
│  👑  Por: @${m.sender.split('@')[0]}
│`), { mentions: [target] })
      
    } catch (error) {
      console.error('Error en promote:', error)
      await m.reply('❌ *Error al ascender usuario*')
    }
    return
  }

  // ===============================
  // DEGRADAR DE ADMIN
  // ===============================
  if (command === 'demote') {
    const target = await AdminUtils.getTargetUser(m, args, participants)
    if (!target) {
      return m.reply(AdminUtils.formatBox('QUITAR ADMIN', `│
│  📌  Uso correcto:
│
│  ${usedPrefix}demote @usuario
│  ${usedPrefix}demote (responde)
│`))
    }

    try {
      await conn.groupParticipantsUpdate(m.chat, [target], 'demote')
      
      await m.reply(AdminUtils.formatBox('ADMIN DEGRADADO', `│
│  ⬇️  Usuario degradado
│
│  👤  @${target.split('@')[0]}
│  🚫  Ya no es administrador
│  👑  Por: @${m.sender.split('@')[0]}
│`), { mentions: [target] })
      
    } catch (error) {
      console.error('Error en demote:', error)
      await m.reply('❌ *Error al degradar usuario*')
    }
    return
  }

  // ===============================
  // EXPULSIÓN MASIVA
  // ===============================
  if (command === 'masskick') {
    if (!isOwner) {
      return m.reply('👑 *Solo el dueño del bot puede usar esta función*')
    }

    const nonAdmins = participants
      .filter(p => !p.admin && !areJidsSameUser(p.id, conn.user.jid))
      .map(p => p.id)

    if (nonAdmins.length === 0) {
      return m.reply('✅ *No hay usuarios no-admin para expulsar*')
    }

    if (nonAdmins.length > MAX_MASS_KICK) {
      return m.reply(`⚠️ *Demasiados usuarios (${nonAdmins.length})*\nMáximo permitido: ${MAX_MASS_KICK}`)
    }

    PendingActionManager.setAction(m.sender, {
      id: 'mass_kick_' + Date.now(),
      type: 'mass_kick_confirm',
      chat: m.chat,
      targets: nonAdmins,
      count: nonAdmins.length
    })

    const warning = AdminUtils.formatBox('⚠️ CONFIRMAR EXPULSIÓN MASIVA ⚠️', `│
│  🚨  ADVERTENCIA
│
│  Se expulsarán: ${nonAdmins.length} usuarios
│
│  📋  Usuarios a expulsar:
${AdminUtils.formatUserList(nonAdmins)}
│
│  ❗  Esta acción NO se puede deshacer
│
│  ✅  Para confirmar:
│      ${usedPrefix}confirm
│
│  ❌  Para cancelar:
│      ${usedPrefix}cancel
│
│  ⏱️  Expira en 2 minutos
│`)

    await m.reply(warning)
    return
  }

  // ===============================
  // INFORMACIÓN DEL GRUPO
  // ===============================
  if (command === 'groupinfo' || command === 'ginfo') {
    const admins = participants.filter(p => p.admin).length
    const bots = participants.filter(p => p.id.includes('@s.whatsapp.net') && p.id !== conn.user.jid).length
    const owner = participants.find(p => p.admin === 'superadmin')
    
    const info = AdminUtils.formatBox('📊 INFORMACIÓN DEL GRUPO', `│
│  🏷️  Nombre: ${groupMetadata.subject}
│  📝  Descripción: ${groupMetadata.desc || 'Sin descripción'}
│
│  👥  Miembros totales: ${participants.length}
│  👑  Administradores: ${admins}
│  🤖  Bots detectados: ${bots}
│  ⭐  Dueño: @${owner?.id?.split('@')[0] || 'No identificado'}
│
│  🔒  Configuración:
│  • ${groupMetadata.announce ? 'Solo admins' : 'Todos'} pueden enviar
│  • ${groupMetadata.restrict ? 'Restringido' : 'Libre'}
│  • Creado: ${new Date(groupMetadata.creation * 1000).toLocaleDateString()}
│
│  📅  Última actualización:
│      ${new Date().toLocaleString()}
│`)

    await m.reply(info)
    return
  }
}

// ===============================
// MANEJADORES DE RESPUESTAS
// ===============================
async function handleAddUserResponse(m, conn, action) {
  const text = m.text?.trim()
  
  if (text?.toLowerCase() === 'cancelar') {
    PendingActionManager.clearAction(m.sender)
    await m.reply('❌ *Acción cancelada*')
    return
  }

  if (!text || !/^\d+$/.test(text.replace(/\D/g, ''))) {
    await m.reply('❌ *Número inválido*\nEnvía solo números (ej: 5213312345678)\nO escribe "cancelar"')
    return
  }

  let number = text.replace(/\D/g, '')
  if (!number.startsWith('521') && number.length === 10) {
    number = '521' + number
  }
  
  const userJid = number + '@s.whatsapp.net'

  try {
    await conn.groupParticipantsUpdate(action.chat, [userJid], 'add')
    
    PendingActionManager.clearAction(m.sender)
    
    await m.reply(AdminUtils.formatBox('✅ USUARIO AÑADIDO', `│
│  👤  Usuario: ${number}
│  📞  Añadido exitosamente
│  👑  Por: @${m.sender.split('@')[0]}
│  ⏰  Hora: ${new Date().toLocaleTimeString()}
│`))
    
  } catch (error) {
    console.error('Error al añadir:', error)
    let errorMsg = '❌ *Error al añadir usuario*'
    
    if (error.message.includes('not authorized')) {
      errorMsg = '⛔ *No tienes permiso para añadir usuarios*'
    } else if (error.message.includes('invite')) {
      errorMsg = '🔗 *El enlace de invitación no es válido*'
    } else if (error.message.includes('blocked')) {
      errorMsg = '🚫 *El usuario te tiene bloqueado*'
    }
    
    await m.reply(errorMsg)
    PendingActionManager.clearAction(m.sender)
  }
}

async function handleMassKickConfirm(m, conn, action) {
  const text = m.text?.toLowerCase()
  
  if (text === `${global.prefix}confirm` || text === 'confirmar') {
    await m.reply(`💥 *Expulsando ${action.count} usuarios...*`)
    
    let success = 0
    let failed = 0
    
    for (const target of action.targets) {
      try {
        await AdminUtils.delay(1500) // Delay para evitar rate limit
        await conn.groupParticipantsUpdate(action.chat, [target], 'remove')
        success++
      } catch (error) {
        failed++
        console.error(`Error expulsando ${target}:`, error)
      }
    }
    
    PendingActionManager.clearAction(m.sender)
    
    const result = AdminUtils.formatBox('📊 RESULTADO MASSKICK', `│
│  ✅  Expulsados: ${success}
│  ❌  Fallados: ${failed}
│  ⏰  Duración: ${action.count * 1.5} segundos
│  👑  Ejecutado por: @${m.sender.split('@')[0]}
│  📅  Fecha: ${new Date().toLocaleString()}
│`)
    
    await m.reply(result)
    
  } else if (text === `${global.prefix}cancel` || text === 'cancelar') {
    PendingActionManager.clearAction(m.sender)
    await m.reply('❌ *Expulsión masiva cancelada*')
  }
}

// ===============================
// METADATA
// ===============================
handler.command = ['adminpanel', 'ap', 'add', 'kick', 'promote', 'demote', 'masskick', 'groupinfo', 'ginfo']
handler.tags = ['admin', 'group']
handler.group = true
handler.admin = true
handler.botAdmin = true

handler.help = [
  'adminpanel - Panel de administración completo',
  'add - Añadir usuario al grupo',
  'kick @user - Expulsar usuario',
  'promote @user - Hacer administrador',
  'demote @user - Quitar administrador',
  'masskick - Expulsión masiva (solo owner)',
  'groupinfo - Información del grupo'
]

export default handler