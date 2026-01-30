
const handler = async (m, { conn, usedPrefix, command }) => {
  // Solo para SubBots
  if (conn.user.jid === global.conn.user.jid) {
    return m.reply('❌ Este comando solo funciona en SubBots.')
  }

  try {
    // Obtener prefijo del SubBot
    const botPrefix = conn.subConfig?.prefix || global.prefix
    const botName = conn.subConfig?.name || conn.user.name || 'SubBot'
    
    // Filtrar comandos disponibles
    const availableCommands = []
    const excludedCategories = ['owner', 'fernando', 'jadibot']
    
    for (const [key, plugin] of Object.entries(global.plugins)) {
      if (!plugin.help || !plugin.tags) continue
      
      // Excluir comandos de categorías restringidas
      const isBlocked = plugin.tags?.some(tag => excludedCategories.includes(tag))
      if (isBlocked) continue
      
      // Verificar permisos
      if (plugin.owner && !conn.isOwner) continue
      if (plugin.rowner && !conn.isROwner) continue
      if (plugin.premium && !conn.isPrems) continue
      
      // Obtener nombre del comando
      let cmdName = ''
      if (Array.isArray(plugin.command)) {
        cmdName = plugin.command[0]
      } else if (typeof plugin.command === 'string') {
        cmdName = plugin.command
      }
      
      if (cmdName && !availableCommands.some(cmd => cmd.name === cmdName)) {
        availableCommands.push({
          name: cmdName,
          description: Array.isArray(plugin.help) ? plugin.help[0] : plugin.help,
          category: Array.isArray(plugin.tags) ? plugin.tags[0] : plugin.tags || 'general'
        })
      }
    }
    
    // Agrupar por categoría
    const categorized = {}
    availableCommands.forEach(cmd => {
      if (!categorized[cmd.category]) {
        categorized[cmd.category] = []
      }
      categorized[cmd.category].push(cmd)
    })
    
    // Crear mensaje
    let message = `🤖 *COMANDOS DISPONIBLES - ${botName}*\n\n`
    message += `🔧 *Prefijo actual:* \`${botPrefix}\`\n`
    message += `📊 *Total comandos:* ${availableCommands.length}\n\n`
    
    // Mostrar categorías principales
    const mainCategories = ['main', 'games', 'herramientas', 'descargas', 'diversión']
    
    for (const category of mainCategories) {
      if (categorized[category] && categorized[category].length > 0) {
        const commands = categorized[category]
        message += `📁 *${category.toUpperCase()}* (${commands.length})\n`
        
        // Mostrar primeros 5 comandos
        const displayed = commands.slice(0, 5)
        displayed.forEach(cmd => {
          message += `├ ${botPrefix}${cmd.name}\n`
        })
        
        if (commands.length > 5) {
          message += `└ ... y ${commands.length - 5} más\n`
        }
        
        message += '\n'
      }
    }
    
    // Otras categorías
    let otherCommands = 0
    for (const [category, commands] of Object.entries(categorized)) {
      if (!mainCategories.includes(category)) {
        otherCommands += commands.length
      }
    }
    
    if (otherCommands > 0) {
      message += `📁 *OTROS* (${otherCommands})\n`
      message += `└ Usa el comando seguido del nombre para más info\n\n`
    }
    
    message += `📌 *Comandos útiles:*\n`
    message += `• ${botPrefix}subconfig - Configurar tu SubBot\n`
    message += `• ${botPrefix}botlist - Ver bots activos\n`
    message += `• ${botPrefix}resetbot - Reiniciar este bot\n\n`
    message += `ℹ️ *Nota:* Escribe el comando completo para ver su descripción.`
    
    await conn.sendMessage(m.chat, { 
      text: message,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true
      }
    }, { quoted: m })
    
  } catch (error) {
    console.error(error)
    m.reply('❌ Error al cargar comandos.')
  }
}

handler.help = ['subcmd']
handler.tags = ['subbot']
handler.command = ['subcmd', 'comandos', 'cmd']
handler.premium = false
handler.group = false
handler.private = false

export default handler