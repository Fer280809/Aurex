var handler = async (m, { conn, usedPrefix, command, text }) => {
  // Obtener usuario de múltiples formas
  let who
  
  if (m.mentionedJid && m.mentionedJid.length > 0) {
    who = m.mentionedJid[0]
  } else if (m.quoted && m.quoted.sender) {
    who = m.quoted.sender
  } else if (text) {
    const number = text.replace(/[^\d]/g, '')
    if (number.length >= 10) {
      who = number + '@s.whatsapp.net'
    } else {
      // Buscar en el texto el @usuario
      const mentionMatch = text.match(/@\d+/)
      if (mentionMatch) {
        who = mentionMatch[0].replace('@', '') + '@s.whatsapp.net'
      }
    }
  }

  if (!who) {
    return conn.reply(m.chat, 
      `❀ Debes mencionar a un usuario, responder a su mensaje, o escribir su número.\n\n` +
      `*Ejemplos:*\n` +
      `• ${usedPrefix + command} @usuario\n` +
      `• ${usedPrefix + command} 521234567890\n` +
      `• ${usedPrefix + command} 10m @usuario`, 
    m)
  }

  // Normalizar el JID
  who = who.replace(/\s+/g, '').trim()
  if (!who.includes('@s.whatsapp.net')) {
    who = who + '@s.whatsapp.net'
  }

  try {
    // Obtener metadatos del grupo actualizados
    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) {
      return conn.reply(m.chat, 'ꕥ No se pudo obtener la información del grupo.', m)
    }

    const participants = groupMetadata.participants || []
    
    // Verificar si el usuario está en el grupo
    const participant = participants.find(p => p.id === who)
    if (!participant) {
      return conn.reply(m.chat, `ꕥ El usuario no está en este grupo.`, m)
    }

    // Verificaciones de seguridad
    if (who === conn.user.jid) {
      return conn.reply(m.chat, `ꕥ No puedo silenciar al bot.`, m)
    }
    
    // Verificar si es propietario del grupo
    if (who === groupMetadata.owner || participant.admin === 'superadmin') {
      return conn.reply(m.chat, `ꕥ No puedo silenciar al propietario del grupo.`, m)
    }
    
    // Verificar si es administrador
    if (participant.admin === 'admin' || participant.admin === true) {
      return conn.reply(m.chat, `ꕥ No puedo silenciar a un administrador del grupo.`, m)
    }

    // Extraer tiempo del comando
    let timeMatch = text.match(/(\d+)\s*([smhd])/i)
    let duration = 0
    let durationText = 'indefinidamente'

    if (timeMatch) {
      const value = parseInt(timeMatch[1])
      const unit = timeMatch[2].toLowerCase()
      
      switch(unit) {
        case 's': duration = value * 1000; durationText = `${value} segundo${value > 1 ? 's' : ''}`; break
        case 'm': duration = value * 60 * 1000; durationText = `${value} minuto${value > 1 ? 's' : ''}`; break
        case 'h': duration = value * 60 * 60 * 1000; durationText = `${value} hora${value > 1 ? 's' : ''}`; break
        case 'd': duration = value * 24 * 60 * 60 * 1000; durationText = `${value} día${value > 1 ? 's' : ''}`; break
      }
    }

    // Inicializar estructura de datos
    if (!global.db.data) global.db.data = {}
    if (!global.db.data.chats) global.db.data.chats = {}
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
    if (!global.db.data.chats[m.chat].mutes) global.db.data.chats[m.chat].mutes = {}

    // Verificar si ya está muteado
    const existingMute = global.db.data.chats[m.chat].mutes[who]
    if (existingMute) {
      if (existingMute.expiresAt && existingMute.expiresAt > Date.now()) {
        const timeLeft = existingMute.expiresAt - Date.now()
        return conn.reply(m.chat, 
          `ꕥ Este usuario ya está silenciado.\n` +
          `⏳ Tiempo restante: ${formatTime(timeLeft)}`, 
        m)
      } else if (!existingMute.expiresAt) {
        return conn.reply(m.chat, 'ꕥ Este usuario ya está silenciado indefinidamente.', m)
      }
    }

    // Obtener nombre del usuario
    const userName = await conn.getName(who).catch(() => who.split('@')[0])

    // Registrar el mute
    global.db.data.chats[m.chat].mutes[who] = {
      mutedAt: Date.now(),
      mutedBy: m.sender,
      duration: duration,
      expiresAt: duration > 0 ? Date.now() + duration : null,
      name: userName
    }

    // Mensaje de confirmación
    await conn.reply(m.chat, 
      `✅ *Usuario silenciado*\n\n` +
      `• *Usuario:* @${who.split('@')[0]}\n` +
      `• *Duración:* ${durationText}\n` +
      `• *Por:* @${m.sender.split('@')[0]}\n\n` +
      `_No podrá enviar mensajes en este grupo._`,
    m, { mentions: [who, m.sender] })

    // Si hay duración, programar unmute automático
    if (duration > 0) {
      setTimeout(async () => {
        try {
          if (global.db.data.chats?.[m.chat]?.mutes?.[who]) {
            delete global.db.data.chats[m.chat].mutes[who]
            await conn.reply(m.chat, 
              `✅ *Silencio expirado*\n\n` +
              `@${who.split('@')[0]} ya puede enviar mensajes nuevamente.`,
            m, { mentions: [who] })
          }
        } catch (e) {
          console.error('Error en auto-unmute:', e)
        }
      }, duration)
    }

  } catch (e) {
    console.error('Error en comando mute:', e)
    conn.reply(m.chat, 
      `⚠️ *Error*\n\n` +
      `No se pudo completar la acción.\n` +
      `_Error: ${e.message}_`,
    m)
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

handler.help = ['mute <@user/número> [tiempo]']
handler.tags = ['grupo']
handler.command = ['mute', 'silenciar', 'callar']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler