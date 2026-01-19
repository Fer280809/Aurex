let handler = async (m, { conn, usedPrefix }) => {
  const senderDigits = m.sender.split('@')[0]
  
  // Verificar si es usuario premium
  const isPremiumUser = global.premiumUsers && global.premiumUsers.includes(senderDigits)
  const isOwner = global.owner && global.owner.map(v => v.replace(/\D/g, '')).includes(senderDigits)
  
  if (!isPremiumUser && !isOwner) {
    return m.reply(`❀ Este comando es exclusivo para usuarios premium.`)
  }
  
  // Obtener bots del usuario
  let userBots = []
  if (global.premiumBots) {
    userBots = Object.values(global.premiumBots).filter(bot => 
      bot.owner === senderDigits
    )
  }
  
  if (userBots.length === 0) {
    return m.reply(`❀ No tienes bots premium creados.\nUsa *${usedPrefix}crearbot* para crear uno.`)
  }
  
  let message = `✨ *TUS BOTS PREMIUM* ✨\n\n`
  
  userBots.forEach((bot, index) => {
    const statusEmoji = bot.status === 'online' ? '🟢' : 
                       bot.status === 'offline' ? '🔴' : '🟡'
    
    message += `${index + 1}. *${bot.label || 'Sin nombre'}*\n`
    message += `   📱 +${bot.phone}\n`
    message += `   ${statusEmoji} ${bot.status || 'desconocido'}\n`
    
    if (bot.created) {
      try {
        const date = new Date(bot.created)
        message += `   📅 Creado: ${date.toLocaleDateString('es-MX')}\n`
      } catch (e) {
        message += `   📅 Creado: ${bot.created}\n`
      }
    }
    
    // Mostrar configuración básica
    if (bot.config) {
      message += `   ⚙️ Prefijo: ${bot.config.prefix || '.'}\n`
    }
    
    message += `\n`
  })
  
  const maxBots = global.premiumFeatures?.maxSubBots || 5
  message += `*Total:* ${userBots.length}/${maxBots} bots\n`
  message += `*Comandos disponibles:*\n`
  message += `• ${usedPrefix}crearbot <número> [nombre] - Crear nuevo bot\n`
  message += `• ${usedPrefix}panel - Acceso al panel web\n`
  message += `• ${usedPrefix}misbots - Ver esta lista`
  
  await conn.reply(m.chat, message, m)
}

handler.help = ['misbots']
handler.tags = ['premium']
handler.command = ['misbots', 'mybots', 'listabots']
export default handler
