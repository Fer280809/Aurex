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
    }
  }

  if (!who) {
    return conn.reply(m.chat, 
      `❀ Debes mencionar a un usuario, responder a su mensaje, o escribir su número para quitarle el silencio.\n\n` +
      `*Ejemplos:*\n` +
      `• ${usedPrefix + command} @usuario\n` +
      `• ${usedPrefix + command} 521234567890`,
    m)
  }

  // Normalizar el JID
  who = who.replace(/\s+/g, '').trim()
  if (!who.includes('@s.whatsapp.net')) {
    who = who + '@s.whatsapp.net'
  }

  try {
    // Verificar estructura de datos
    if (!global.db.data?.chats?.[m.chat]?.mutes?.[who]) {
      return conn.reply(m.chat, `ꕥ Este usuario no está silenciado.`, m)
    }

    // Obtener nombre antes de eliminar
    const userName = global.db.data.chats[m.chat].mutes[who].name || who.split('@')[0]
    
    // Remover el mute
    delete global.db.data.chats[m.chat].mutes[who]

    // Mensaje de confirmación
    await conn.reply(m.chat, 
      `✅ *Silencio removido*\n\n` +
      `@${who.split('@')[0]} ya puede enviar mensajes nuevamente.`,
    m, { mentions: [who] })

  } catch (e) {
    console.error('Error en comando unmute:', e)
    conn.reply(m.chat, 
      `⚠️ *Error*\n\n` +
      `No se pudo completar la acción.\n` +
      `_Error: ${e.message}_`,
    m)
  }
}

handler.help = ['unmute <@user/número>']
handler.tags = ['grupo']
handler.command = ['unmute', 'desmutear', 'dessilenciar']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler