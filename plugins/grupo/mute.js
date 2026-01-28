var handler = async (m, { conn, participants, usedPrefix, command, text }) => {
  // Obtener usuario de múltiples formas: mención, reply, o número de teléfono
  let who
  
  // 1. Primero intentar obtener de mención explícita
  if (m.mentionedJid && m.mentionedJid.length > 0) {
    who = m.mentionedJid[0]
  }
  // 2. Si no hay mención, intentar obtener del mensaje citado (reply)
  else if (m.quoted && m.quoted.sender) {
    who = m.quoted.sender
  }
  // 3. Si no hay reply, buscar número de teléfono en el texto
  else if (text) {
    // Extraer número del texto (puede estar con o sin @, con o sin espacios)
    let number = text.replace(/[^\d]/g, '')
    if (number.length >= 10) {
      who = number + '@s.whatsapp.net'
    }
  }

  if (!who) {
    return conn.reply(m.chat, `❀ Debes mencionar a un usuario, responder a su mensaje, o escribir su número.\n\n*Ejemplos:*\n• ${usedPrefix + command} @usuario\n• ${usedPrefix + command} 521234567890\n• ${usedPrefix + command} 10m @usuario (por tiempo)`, m)
  }

  // Normalizar el JID
  who = who.replace(/\s+/g, '').trim()

  // Extraer tiempo del comando (buscar patrón número+unidad al inicio o en cualquier parte)
  let timeMatch = text.match(/(\d+)\s*([smhd])/i)
  let duration = 0
  let durationText = 'indefinidamente'

  if (timeMatch) {
    let value = parseInt(timeMatch[1])
    let unit = timeMatch[2].toLowerCase()

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

  try {
    const groupInfo = await conn.groupMetadata(m.chat)
    const ownerGroup = groupInfo.owner || m.chat.split`-`[0] + '@s.whatsapp.net'
    const ownerBot = global.owner[0][0] + '@s.whatsapp.net'

    // Verificaciones de seguridad
    if (who === conn.user.jid) return conn.reply(m.chat, `ꕥ No puedo silenciar al bot.`, m)
    if (who === ownerGroup) return conn.reply(m.chat, `ꕥ No puedo silenciar al propietario del grupo.`, m)
    if (who === ownerBot) return conn.reply(m.chat, `ꕥ No puedo silenciar al propietario del bot.`, m)

    // Verificar si el usuario está en el grupo
    const participant = participants.find(p => p.id === who)
    if (!participant) return conn.reply(m.chat, `ꕥ El usuario no está en este grupo.`, m)

    // Verificar si el usuario es admin
    if (participant.admin) return conn.reply(m.chat, `ꕥ No puedo silenciar a un administrador del grupo.`, m)

    // Inicializar estructura de datos si no existe
    if (!global.db.data.chats) global.db.data.chats = {}
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
    if (!global.db.data.chats[m.chat].mutes) global.db.data.chats[m.chat].mutes = {}

    // Verificar si ya está muteado
    if (global.db.data.chats[m.chat].mutes[who]) {
      const muteData = global.db.data.chats[m.chat].mutes[who]
      const remainingTime = muteData.expiresAt ? Math.max(0, muteData.expiresAt - Date.now()) : null

      if (remainingTime === null) {
        return conn.reply(m.chat, `ꕥ Este usuario ya está silenciado indefinidamente.`, m)
      } else if (remainingTime > 0) {
        const timeLeft = formatTime(remainingTime)
        return conn.reply(m.chat, `ꕥ Este usuario ya está silenciado. Tiempo restante: ${timeLeft}`, m)
      }
    }

    // Obtener nombre del usuario
    let userName = who.split('@')[0]
    try {
      userName = await conn.getName(who) || userName
    } catch {}

    // Registrar el mute
    global.db.data.chats[m.chat].mutes[who] = {
      mutedAt: Date.now(),
      mutedBy: m.sender,
      duration: duration,
      expiresAt: duration > 0 ? Date.now() + duration : null,
      name: userName
    }

    // Mensaje de confirmación
    await conn.reply(m.chat, `✓ Usuario @${who.split('@')[0]} ha sido silenciado ${durationText}.\n\n_No podrá enviar mensajes en este grupo._`, m, {
      mentions: [who]
    })

    // Si hay duración, programar unmute automático
    if (duration > 0) {
      setTimeout(async () => {
        try {
          if (global.db.data.chats[m.chat]?.mutes?.[who]) {
            delete global.db.data.chats[m.chat].mutes[who]
            await conn.reply(m.chat, `✓ El silencio de @${who.split('@')[0]} ha expirado.`, null, {
              mentions: [who]
            })
          }
        } catch (e) {
          console.error('Error en auto-unmute:', e)
        }
      }, duration)
    }

  } catch (e) {
    console.error('Error en mute:', e)
    conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${e.message}`, m)
  }
}

// Función auxiliar para formatear tiempo
function formatTime(ms) {
  if (ms < 1000) return '0 segundos'

  const seconds = Math.floor((ms / 1000) % 60)
  const minutes = Math.floor((ms / (1000 * 60)) % 60)
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))

  const parts = []
  if (days > 0) parts.push(`${days} día${days > 1 ? 's' : ''}`)
  if (hours > 0) parts.push(`${hours} hora${hours > 1 ? 's' : ''}`)
  if (minutes > 0) parts.push(`${minutes} minuto${minutes > 1 ? 's' : ''}`)
  if (seconds > 0) parts.push(`${seconds} segundo${seconds > 1 ? 's' : ''}`)

  return parts.join(', ') || '0 segundos'
}

handler.help = ['mute <@user/número> [tiempo]']
handler.tags = ['grupo']
handler.command = ['mute', 'silenciar', 'callar']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
