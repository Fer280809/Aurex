let handler = async (m, { conn, args, usedPrefix }) => {
  const senderDigits = m.sender.split('@')[0]
  
  // Verificar premium
  const isPremiumUser = global.premiumUsers && global.premiumUsers.includes(senderDigits)
  const isOwner = global.owner && global.owner.map(v => v.replace(/\D/g, '')).includes(senderDigits)
  
  if (!isPremiumUser && !isOwner) {
    return m.reply(`❀ Este comando es exclusivo para usuarios premium.`)
  }
  
  const botIndex = args[0] ? parseInt(args[0]) - 1 : 0
  
  // Obtener bots del usuario
  let userBots = []
  if (global.premiumBots) {
    userBots = Object.values(global.premiumBots).filter(bot => 
      bot.owner === senderDigits
    )
  }
  
  if (userBots.length === 0) {
    return m.reply(`❀ No tienes bots premium.`)
  }
  
  if (isNaN(botIndex) || botIndex < 0 || botIndex >= userBots.length) {
    // Mostrar lista
    let list = `📊 *ESTADO DE TUS BOTS* 📊\n\n`
    userBots.forEach((bot, index) => {
      const statusIcon = bot.status === 'online' ? '🟢' : 
                        bot.status === 'offline' ? '🔴' : '🟡'
      list += `${index + 1}. ${statusIcon} *${bot.label || 'Sin nombre'}*\n`
      list += `   📱 +${bot.phone}\n`
    })
    list += `\n*Para ver detalles:* ${usedPrefix}estadobot <número>`
    return m.reply(list)
  }
  
  const bot = userBots[botIndex]
  
  // Verificar si está conectado
  let isConnected = false
  if (global.premiumConns) {
    isConnected = global.premiumConns.some(conn => 
      conn.botConfig && conn.botConfig.phone === bot.phone
    )
  }
  
  let message = `📊 *ESTADO DETALLADO DEL BOT* 📊\n\n`
  message += `🤖 *Nombre:* ${bot.label || 'Sin nombre'}\n`
  message += `📱 *Número:* +${bot.phone}\n`
  message += `👤 *Propietario:* +${bot.owner}\n`
  message += `📅 *Creado:* ${new Date(bot.created).toLocaleDateString('es-MX')}\n`
  
  if (bot.connectedAt) {
    const uptime = Math.floor((Date.now() - new Date(bot.connectedAt).getTime()) / 1000)
    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = uptime % 60
    
    message += `⏱️ *Conectado hace:* ${hours}h ${minutes}m ${seconds}s\n`
  }
  
  message += `🔌 *Estado conexión:* ${isConnected ? '🟢 CONECTADO' : '🔴 DESCONECTADO'}\n`
  message += `📊 *Estado sistema:* ${bot.status || 'desconocido'}\n\n`
  
  message += `📈 *ESTADÍSTICAS:*\n`
  if (bot.stats) {
    message += `• Mensajes: ${bot.stats.messages || 0}\n`
    message += `• Grupos: ${bot.stats.groups || 0}\n`
    message += `• Usuarios: ${bot.stats.users || 0}\n`
  } else {
    message += `No hay estadísticas disponibles.\n`
  }
  
  message += `\n⚙️ *CONFIGURACIÓN:*\n`
  if (bot.config) {
    message += `• Prefijo: ${bot.config.prefix || '.'}\n`
    message += `• Nombre: ${bot.config.name || 'No definido'}\n`
    message += `• Estado: ${bot.config.status || 'No definido'}\n`
  }
  
  message += `\n🔧 *ACCIONES RÁPIDAS:*\n`
  message += `• ${usedPrefix}reiniciar ${botIndex + 1} - Reiniciar bot\n`
  message += `• ${usedPrefix}editar ${botIndex + 1} - Editar configuración\n`
  message += `• ${usedPrefix}panel - Panel web completo`
  
  await conn.reply(m.chat, message, m)
}

handler.help = ['estadobot [número]', 'statusbot']
handler.tags = ['premium']
handler.command = ['estadobot', 'statusbot', 'botstatus', 'infobot']
export default handler