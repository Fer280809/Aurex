let handler = async (m, { conn, args, usedPrefix, command }) => {
  const senderDigits = m.sender.split('@')[0]
  
  // Verificar premium
  if (!global.premiumUsers || !global.premiumUsers.includes(senderDigits)) {
    if (!global.owner || !global.owner.map(v => v.replace(/\D/g, '')).includes(senderDigits)) {
      return m.reply('❀ Solo usuarios premium pueden usar este comando.')
    }
  }
  
  const botIndex = parseInt(args[0]) - 1
  const newName = args.slice(1).join(' ')
  
  if (isNaN(botIndex) || !newName) {
    return m.reply(`❀ Uso: ${usedPrefix}cambiarnombre <número bot> <nuevo nombre>\nEj: ${usedPrefix}cambiarnombre 1 Mi Super Bot`)
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
    
    // Actualizar nombre
    bot.label = newName
    if (!bot.config) bot.config = {}
    bot.config.name = newName
    bot.updated = new Date().toISOString()
    
    // Guardar cambios
    global.premiumBots[bot.phone] = bot
    if (global.savePremiumData) {
      global.savePremiumData()
    }
    
    const message = `✅ *NOMBRE CAMBIADO EXITOSAMENTE*\n\n`
      + `🤖 Bot: +${bot.phone}\n`
      + `📛 Nuevo nombre: *${newName}*\n`
      + `👤 Propietario: @${m.sender.split('@')[0]}\n`
      + `📅 Fecha: ${new Date().toLocaleString('es-MX')}\n\n`
      + `*El cambio se aplicará en la próxima reconexión.*`
    
    await conn.reply(m.chat, message, m, { mentions: [m.sender] })
    await m.react('✅')
    
  } catch (error) {
    await m.react('❌')
    m.reply(`❀ Error: ${error.message}`)
  }
}

handler.help = ['cambiarnombre <número bot> <nuevo nombre>']
handler.tags = ['premium']
handler.command = ['cambiarnombre', 'setname', 'changename']
export default handler