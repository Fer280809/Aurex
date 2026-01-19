let handler = async (m, { conn, args, usedPrefix }) => {
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
    return m.reply(`❀ No tienes bots premium.\nUsa *${usedPrefix}crearbot* para crear uno.`)
  }
  
  const botIndex = args[0] ? parseInt(args[0]) - 1 : 0
  
  if (isNaN(botIndex) || botIndex < 0 || botIndex >= userBots.length) {
    // Mostrar lista de bots
    let listMessage = `📋 *TUS BOTS PREMIUM* 📋\n\n`
    
    userBots.forEach((bot, index) => {
      listMessage += `${index + 1}. *${bot.label || 'Sin nombre'}*\n`
      listMessage += `   📱 +${bot.phone}\n`
      listMessage += `   🟢 ${bot.status || 'desconocido'}\n\n`
    })
    
    listMessage += `*Para ver configuración:*\n${usedPrefix}verconfig <número>\n`
    listMessage += `*Ejemplo:* ${usedPrefix}verconfig 1`
    
    return m.reply(listMessage)
  }
  
  const bot = userBots[botIndex]
  
  let message = `⚙️ *CONFIGURACIÓN DEL BOT* ⚙️\n\n`
  message += `🤖 *Nombre:* ${bot.label || 'Sin nombre'}\n`
  message += `📱 *Número:* +${bot.phone}\n`
  message += `📅 *Creado:* ${new Date(bot.created).toLocaleDateString('es-MX')}\n`
  
  if (bot.updated) {
    message += `✏️ *Actualizado:* ${new Date(bot.updated).toLocaleDateString('es-MX')}\n`
  }
  
  message += `🔧 *Estado:* ${bot.status || 'desconocido'}\n\n`
  
  message += `*CONFIGURACIÓN PERSONALIZADA:*\n`
  
  if (bot.config) {
    message += `• *Prefijo:* ${bot.config.prefix || '.'}\n`
    message += `• *Nombre:* ${bot.config.name || 'No definido'}\n`
    message += `• *Estado:* ${bot.config.status || 'No definido'}\n`
    
    if (bot.config.banner) {
      message += `• *Banner:* ${bot.config.banner.substring(0, 30)}...\n`
    }
    
    if (bot.config.icon) {
      message += `• *Ícono:* ${bot.config.icon.substring(0, 30)}...\n`
    }
    
    if (bot.config.channel) {
      message += `• *Canal:* ${bot.config.channel}\n`
    }
    
    if (bot.config.group) {
      message += `• *Grupo:* ${bot.config.group}\n`
    }
  } else {
    message += `No hay configuración personalizada aún.\n`
  }
  
  message += `\n*COMANDOS DISPONIBLES:*\n`
  message += `• ${usedPrefix}editar ${botIndex + 1} nombre <nuevo nombre>\n`
  message += `• ${usedPrefix}editar ${botIndex + 1} prefijo <nuevo prefijo>\n`
  message += `• ${usedPrefix}editar ${botIndex + 1} banner <url>\n`
  message += `• ${usedPrefix}editar ${botIndex + 1} icono <url>\n`
  message += `• ${usedPrefix}panel - Acceso al panel web completo`
  
  // Enviar imagen del bot si existe
  try {
    if (bot.config && bot.config.banner) {
      await conn.sendMessage(m.chat, {
        image: { url: bot.config.banner },
        caption: message
      }, { quoted: m })
    } else {
      await conn.reply(m.chat, message, m)
    }
  } catch (e) {
    await conn.reply(m.chat, message, m)
  }
}

handler.help = ['verconfig [número]', 'config']
handler.tags = ['premium']
handler.command = ['verconfig', 'config', 'verconfiguracion', 'configuracion']
export default handler
