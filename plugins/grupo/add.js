import moment from 'moment-timezone'

let handler = async (m, { conn, args, text, usedPrefix, command, editMessage }) => {
  // Si no hay número, pedirlo
  if (!text) {
    const message = `❀ *INVITACIÓN A GRUPO*\n\nEscribe el número:\n\`\`\`${usedPrefix}add 1234567890\`\`\``
    
    if (editMessage) {
      await editMessage(message)
    } else {
      await conn.reply(m.chat, message, m)
    }
    return
  }
  
  // Quitar + si existe
  let numero = text.replace('+', '')
  
  // Validar que sea número
  if (isNaN(numero)) {
    const message = `❀ *ERROR*\n\nSolo números:\n\`${usedPrefix}add 1234567890\``
    
    if (editMessage) {
      await editMessage(message)
    } else {
      await conn.reply(m.chat, message, m)
    }
    return
  }
  
  try {
    // Generar link
    let link = 'https://chat.whatsapp.com/' + await conn.groupInviteCode(m.chat)
    let tag = '@' + m.sender.split('@')[0]
    const horario = moment.tz('America/Caracas').format('DD/MM/YYYY hh:mm:ss A')
    
    // Mensaje de invitación
    const invite = `❀ 𝗜𝗡𝗩𝗜𝗧𝗔𝗖𝗜𝗢𝗡\n\n👤 ${tag}\n📅 ${horario}\n🔗 ${link}`
    
    // Enviar al número
    await conn.reply(`${numero}@s.whatsapp.net`, invite, m)
    
    // Confirmar éxito
    const successMsg = `✅ Enviado a: ${numero}\n📅 ${horario}`
    
    if (editMessage) {
      await editMessage(successMsg)
    } else {
      await m.reply(successMsg)
    }
    
  } catch (error) {
    const errorMsg = `❌ Error con: ${numero}\n${error.message}`
    
    if (editMessage) {
      await editMessage(errorMsg)
    } else {
      await m.reply(errorMsg)
    }
  }
}

handler.help = ['invite']
handler.tags = ['group']
handler.command = ['add', 'agregar', 'añadir']
handler.group = true
handler.botAdmin = true
handler.editMessage = true // ← Para botones editables

export default handler