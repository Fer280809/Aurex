let handler = async (m, { conn, args, usedPrefix, command }) => {
  const senderDigits = m.sender.split('@')[0]
  
  // Verificar premium
  if (!global.premiumUsers || !global.premiumUsers.includes(senderDigits)) {
    if (!global.owner || !global.owner.map(v => v.replace(/\D/g, '')).includes(senderDigits)) {
      return m.reply('❀ Solo usuarios premium pueden usar este comando.')
    }
  }
  
  const botIndex = parseInt(args[0]) - 1
  const newPrefix = args[1]
  
  if (isNaN(botIndex) || !newPrefix) {
    return m.reply(`❀ Uso: ${usedPrefix}cambiarprefijo <número bot> <nuevo prefijo>\nEj: ${usedPrefix}cambiarprefijo 1 !`)
  }
  
  if (newPrefix.length > 2) {
    return m.reply('❀ El prefijo debe tener máximo 2 caracteres.')
  }
  
  // Obtener bots del usuario
  let userBots = []
  if (global.premiumBots) {
    userBots = Object.values(global.premiumBots).filter(bot => 
      bot.owner === senderDigits
    )
  }
  
  if (botIndex < 0 || botIndex >= userBots.length) {
    return m.reply(`❀ Número de bot inválido. Usa *${usedPrefix}misbots* para ver tus bots.`)
  }
  
  const bot = userBots[botIndex]
  
  try {
    await m.react('🕒')
    
    // Actualizar prefijo
    if (!bot.config) bot.config = {}
    bot.config.prefix = newPrefix
    bot.updated = new Date().toISOString()
    
    // Guardar cambios
    global.premiumBots[bot.phone] = bot
    if (global.savePremiumData) {
      global.savePremiumData()
    }
    
    const message = `✅ *PREFIJO CAMBIADO EXITOSAMENTE*\n\n`
      + `🤖 Bot: +${bot.phone}\n`
      + `🔣 Nuevo prefijo: *${newPrefix}*\n`
      + `📛 Nombre: ${bot.label || 'Sin nombre'}\n`
      + `👤 Propietario: @${m.sender.split('@')[0]}\n`
      + `📅 Fecha: ${new Date().toLocaleString('es-MX')}\n\n`
      + `*Ejemplo de uso:* ${newPrefix}menu\n`
      + `*Los comandos ahora usarán este prefijo.*`
    
    await conn.reply(m.chat, message, m, { mentions: [m.sender] })
    await m.react('✅')
    
  } catch (error) {
    await m.react('❌')
    m.reply(`❀ Error: ${error.message}`)
  }
}

handler.help = ['cambiarprefijo <número bot> <nuevo prefijo>']
handler.tags = ['premium']
handler.command = ['cambiarprefijo', 'setprefix', 'changeprefix']
export default handler