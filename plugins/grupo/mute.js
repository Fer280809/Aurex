const handler = async (m, { isOwner, isAdmin, conn, text, participants, args, command }) => {
  if (!isAdmin && !isOwner) return m.reply('❌ Solo los administradores pueden usar este comando')
  if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')

  let who
  const pesan = args.join` `
  
  // Detectar usuario mencionado
  if (m.mentionedJid && m.mentionedJid.length > 0) {
    who = m.mentionedJid[0]
  } 
  // Detectar usuario en mensaje citado
  else if (m.quoted && m.quoted.sender) {
    who = m.quoted.sender
  }
  // Detectar número en el texto
  else if (pesan) {
    const number = pesan.replace(/[^0-9]/g, '')
    if (number.length >= 10) {
      who = number + '@s.whatsapp.net'
    } else {
      // Buscar menciones en el texto
      const mentionMatch = pesan.match(/@\d+/)
      if (mentionMatch) {
        who = mentionMatch[0].replace('@', '') + '@s.whatsapp.net'
      }
    }
  }

  if (!who) {
    return m.reply(`⚠️ Debes mencionar o responder al usuario que quieres silenciar.\n\nEjemplo:\n*${command} @usuario*\n*${command} 10m @usuario*`)
  }

  // Normalizar JID
  who = who.replace(/\s+/g, '').trim()
  if (!who.includes('@s.whatsapp.net')) {
    who = who + '@s.whatsapp.net'
  }

  try {
    // Verificar si el usuario está en el grupo
    const userInGroup = participants.find(p => p.id === who)
    if (!userInGroup) {
      return m.reply('❌ El usuario no está en este grupo')
    }

    // Verificar si es el bot
    if (who === conn.user.jid) {
      return m.reply('❌ No puedo silenciarme a mí mismo')
    }

    // Verificar si es el dueño del grupo
    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (groupMetadata && (who === groupMetadata.owner || userInGroup.admin === 'superadmin')) {
      return m.reply('❌ No puedo silenciar al dueño del grupo')
    }

    // Verificar si es administrador
    if (userInGroup.admin === 'admin' || userInGroup.admin === true) {
      return m.reply('❌ No puedo silenciar a un administrador')
    }

    // Detectar tiempo de mute
    let timeMatch = pesan.match(/(\d+)\s*([smhd])/i)
    let duration = 0
    let durationText = 'indefinidamente'

    if (timeMatch) {
      const value = parseInt(timeMatch[1])
      const unit = timeMatch[2].toLowerCase()
      
      switch(unit) {
        case 's':
          duration = value * 1000
          durationText = `${value} segundo${value > 1 ? 's' : ''}`
          break
        case 'm':
          duration = value * 60 * 1000
          durationText = `${value} minuto${value > 1 ? 's' : ''}`
          break
        case 'h':
          duration = value * 60 * 60 * 1000
          durationText = `${value} hora${value > 1 ? 's' : ''}`
          break
        case 'd':
          duration = value * 24 * 60 * 60 * 1000
          durationText = `${value} día${value > 1 ? 's' : ''}`
          break
      }
    }

    // Inicializar estructura de mutes
    if (!global.db.data) global.db.data = {}
    if (!global.db.data.chats) global.db.data.chats = {}
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
    if (!global.db.data.chats[m.chat].mutes) global.db.data.chats[m.chat].mutes = {}

    // Verificar si ya está muteado
    const existingMute = global.db.data.chats[m.chat].mutes[who]
    if (existingMute) {
      if (existingMute.expiresAt && existingMute.expiresAt > Date.now()) {
        const timeLeft = existingMute.expiresAt - Date.now()
        const timeText = formatTime(timeLeft)
        return m.reply(`⚠️ Este usuario ya está silenciado\n\n⏳ Tiempo restante: ${timeText}`)
      } else if (!existingMute.expiresAt) {
        return m.reply('⚠️ Este usuario ya está silenciado indefinidamente')
      }
    }

    // Obtener nombre del usuario
    const userName = await conn.getName(who).catch(() => who.split('@')[0])
    const adminName = await conn.getName(m.sender).catch(() => m.sender.split('@')[0])

    // Registrar el mute
    global.db.data.chats[m.chat].mutes[who] = {
      mutedAt: Date.now(),
      mutedBy: m.sender,
      duration: duration,
      expiresAt: duration > 0 ? Date.now() + duration : null,
      name: userName,
      adminName: adminName
    }

    // Mensaje de confirmación
    const muteMessage = `✅ *USUARIO SILENCIADO*\n\n` +
      `• *Usuario:* @${who.split('@')[0]}\n` +
      `• *Duración:* ${durationText}\n` +
      `• *Por:* @${m.sender.split('@')[0]}\n\n` +
      `_El usuario no podrá enviar mensajes en este grupo._`
    
    conn.sendMessage(m.chat, { 
      text: muteMessage, 
      mentions: [who, m.sender] 
    })

    // Programar desmuteo automático si hay duración
    if (duration > 0) {
      setTimeout(async () => {
        try {
          if (global.db.data.chats?.[m.chat]?.mutes?.[who]) {
            delete global.db.data.chats[m.chat].mutes[who]
            const unmuteMsg = `✅ *SILENCIO EXPIRADO*\n\n@${who.split('@')[0]} ya puede enviar mensajes nuevamente.`
            conn.sendMessage(m.chat, { 
              text: unmuteMsg, 
              mentions: [who] 
            })
          }
        } catch (e) {
          console.error('Error en auto-unmute:', e)
        }
      }, duration)
    }

  } catch (error) {
    console.error('Error en comando mute:', error)
    m.reply(`❌ Ocurrió un error: ${error.message}`)
  }
}

// Función para formatear tiempo
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

handler.help = ['mute @usuario [tiempo]']
handler.tags = ['group']
handler.command = ['mute', 'silenciar', 'callar']
handler.admin = true
handler.group = true

export default handler