import { getUserPremiumBots } from '../sockets-premium.js'

let handler = async (m, { conn, usedPrefix }) => {
  const senderDigits = m.sender.split('@')[0]
  const isPremium = global.premiumUsers.includes(senderDigits) || 
                   global.owner.map(v => v.replace(/\D/g, '')).includes(senderDigits)
  
  if (!isPremium) {
    return m.reply(`❀ Este comando es exclusivo para usuarios premium.`)
  }
  
  const userBots = getUserPremiumBots(senderDigits)
  
  if (userBots.length === 0) {
    return m.reply(`❀ No tienes bots creados.\nUsa *${usedPrefix}crearbot* para crear uno.`)
  }
  
  let message = `✨ *TUS BOTS PREMIUM* ✨\n\n`
  
  userBots.forEach((bot, index) => {
    const statusEmoji = bot.status === 'online' ? '🟢' : 
                       bot.status === 'offline' ? '🔴' : '🟡'
    
    message += `${index + 1}. *${bot.label}*\n`
    message += `   📱 +${bot.phone}\n`
    message += `   ${statusEmoji} ${bot.status}\n`
    message += `   📅 Creado: ${new Date(bot.created).toLocaleDateString('es-MX')}\n`
    message += `   🔗 Panel: http://localhost:3000\n\n`
  })
  
  message += `*Total:* ${userBots.length}/${global.premiumFeatures.maxSubBots} bots\n`
  message += `*Comandos:*\n• ${usedPrefix}crearbot - Crear nuevo bot\n• ${usedPrefix}panel - Acceso al panel web`
  
  await conn.reply(m.chat, message, m)
}

handler.help = ['misbots']
handler.tags = ['premium']
handler.command = ['misbots', 'mybots', 'listabots']
export default handler
