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
    return m.reply(`⚠️ Debes mencionar o responder al usuario que quieres desilenciar.\n\nEjemplo:\n*${command} @usuario*`)
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

    // Verificar estructura de mutes
    if (!global.db.data?.chats?.[m.chat]?.mutes?.[who]) {
      return m.reply('⚠️ Este usuario no está silenciado')
    }

    // Obtener información del mute
    const muteData = global.db.data.chats[m.chat].mutes[who]
    
    // Eliminar el mute
    delete global.db.data.chats[m.chat].mutes[who]

    // Mensaje de confirmación
    const unmuteMessage = `✅ *SILENCIO REMOVIDO*\n\n` +
      `• *Usuario:* @${who.split('@')[0]}\n` +
      `• *Por:* @${m.sender.split('@')[0]}\n\n` +
      `_El usuario ya puede enviar mensajes nuevamente._`
    
    conn.sendMessage(m.chat, { 
      text: unmuteMessage, 
      mentions: [who, m.sender] 
    })

  } catch (error) {
    console.error('Error en comando unmute:', error)
    m.reply(`❌ Ocurrió un error: ${error.message}`)
  }
}

handler.help = ['unmute @usuario']
handler.tags = ['group']
handler.command = ['unmute', 'desmutear', 'dessilenciar']
handler.admin = true
handler.group = true

export default handler