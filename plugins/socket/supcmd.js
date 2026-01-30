import fs from 'fs'
import path from 'path'

const handler = async (m, { conn, usedPrefix, command }) => {
  // Solo permitir en SubBots
  if (conn.user.jid === global.conn.user.jid) {
    return m.reply('❌ Este comando solo funciona en SubBots.')
  }

  try {
    // Cargar configuración del SubBot
    const sessionId = conn.user.jid.split('@')[0]
    const configPath = path.join(global.jadi, sessionId, 'config.json')
    const config = fs.existsSync(configPath) 
      ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      : { prefix: global.prefix }
    
    const botPrefix = config.prefix || global.prefix
    const botName = config.name || conn.user.name || 'SubBot'
    
    // Filtrar comandos disponibles para SubBots
    const availableCommands = []
    const excludedCategories = ['owner', 'fernando', 'jadibot'] // Comandos exclusivos
    
    for (const [key, plugin] of Object.entries(global.plugins)) {
      if (!plugin.help || !plugin.tags) continue
      
      // Verificar si el comando está bloqueado para SubBots
      const isBlocked = plugin.tags?.some(tag => excludedCategories.includes(tag))
      if (isBlocked) continue
      
      // Verificar restricciones
      if (plugin.owner && !conn.isOwner) continue
      if (plugin.rowner && !conn.isROwner) continue
      if (plugin.premium && !conn.isPrems) continue
      
      // Obtener comando principal
      let cmdName = ''
      if (Array.isArray(plugin.command)) {
        cmdName = plugin.command[0]
      } else if (typeof plugin.command === 'string') {
        cmdName = plugin.command
      } else if (plugin.command instanceof RegExp) {
        cmdName = plugin.command.toString()
      }
      
      if (cmdName) {
        availableCommands.push({
          name: cmdName,
          description: plugin.help[0] || 'Sin descripción',
          category: plugin.tags[0] || 'general'
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
    
    for (const [category, commands] of Object.entries(categorized)) {
      message += `📁 *${category.toUpperCase()}* (${commands.length})\n`
      
      // Mostrar máximo 10 por categoría
      const displayed = commands.slice(0, 10)
      displayed.forEach(cmd => {
        message += `├ ${botPrefix}${cmd.name} - ${cmd.description}\n`
      })
      
      if (commands.length > 10) {
        message += `└ ... y ${commands.length - 10} más\n`
      }
      
      message += '\n'
    }
    
    message += `📌 *Uso:*\n`
    message += `• ${botPrefix}cmd <comando> - Ver info de un comando\n`
    message += `• ${botPrefix}config prefix <nuevo> - Cambiar prefijo\n`
    message += `• ${botPrefix}config mode <public/private> - Cambiar modo\n\n`
    message += `⚠️ *Nota:* Algunos comandos requieren permisos de administrador.`
    
    await conn.sendMessage(m.chat, { 
      text: message,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        mentionedJid: [m.sender]
      }
    }, { quoted: m })
    
  } catch (error) {
    console.error(error)
    m.reply('❌ Error al cargar comandos.')
  }
}

handler.help = ['subcmd', 'subcomandos', 'comandos']
handler.tags = ['subbot']
handler.command = ['subcmd', 'subcomandos', 'comandos']
handler.premium = false
handler.group = false
handler.private = false

export default handler