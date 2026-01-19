let handler = async (m, { conn, args, usedPrefix, command }) => {
  const senderDigits = m.sender.split('@')[0]
  
  // Verificar si es usuario premium
  const isPremiumUser = global.premiumUsers && global.premiumUsers.includes(senderDigits)
  const isOwner = global.owner && global.owner.map(v => v.replace(/\D/g, '')).includes(senderDigits)
  
  if (!isPremiumUser && !isOwner) {
    return m.reply(`❀ Este comando es exclusivo para usuarios premium.\nContacta al propietario para adquirir premium.`)
  }
  
  // Obtener bots del usuario
  let userBots = []
  if (global.premiumBots) {
    userBots = Object.values(global.premiumBots).filter(bot => 
      bot.owner === senderDigits
    )
  }
  
  if (userBots.length === 0) {
    return m.reply(`❀ No tienes bots premium para editar.\nUsa *${usedPrefix}crearbot* para crear uno.`)
  }
  
  const botIndex = parseInt(args[0]) - 1
  const editType = args[1]?.toLowerCase()
  const newValue = args.slice(2).join(' ')
  
  if (isNaN(botIndex) || botIndex < 0 || botIndex >= userBots.length) {
    // Mostrar lista de bots para editar
    let message = `✨ *SELECCIONA UN BOT PARA EDITAR* ✨\n\n`
    
    userBots.forEach((bot, index) => {
      message += `${index + 1}. *${bot.label || 'Sin nombre'}*\n`
      message += `   📱 +${bot.phone}\n`
      message += `   📅 Creado: ${new Date(bot.created).toLocaleDateString('es-MX')}\n\n`
    })
    
    message += `*Uso:* ${usedPrefix}editar <número> <opción> <valor>\n`
    message += `*Ejemplo:* ${usedPrefix}editar 1 nombre Mi Nuevo Bot\n\n`
    message += `*Opciones disponibles:*\n`
    message += `• nombre - Cambiar nombre del bot\n`
    message += `• prefijo - Cambiar prefijo de comandos\n`
    message += `• banner - Cambiar URL del banner\n`
    message += `• icono - Cambiar URL del ícono\n`
    message += `• canal - Cambiar enlace del canal\n`
    message += `• grupo - Cambiar enlace del grupo\n`
    message += `• estado - Cambiar estado/bio del bot\n`
    
    return m.reply(message)
  }
  
  if (!editType || !newValue) {
    return m.reply(`❀ Especifica qué quieres editar y el nuevo valor.\nEj: ${usedPrefix}editar ${botIndex + 1} nombre Mi Super Bot`)
  }
  
  const selectedBot = userBots[botIndex]
  const botPhone = selectedBot.phone
  
  try {
    await m.react('🕒')
    
    let updateMessage = ''
    let configUpdate = {}
    
    switch(editType) {
      case 'nombre':
      case 'name':
        configUpdate.name = newValue
        updateMessage = `✅ *Nombre cambiado a:* ${newValue}`
        break
        
      case 'prefijo':
      case 'prefix':
        if (newValue.length > 2) {
          return m.reply('❀ El prefijo debe tener máximo 2 caracteres.')
        }
        configUpdate.prefix = newValue
        updateMessage = `✅ *Prefijo cambiado a:* ${newValue}`
        break
        
      case 'banner':
        if (!newValue.startsWith('http')) {
          return m.reply('❀ La URL del banner debe comenzar con http:// o https://')
        }
        configUpdate.banner = newValue
        updateMessage = `✅ *Banner actualizado*`
        break
        
      case 'icono':
      case 'icon':
        if (!newValue.startsWith('http')) {
          return m.reply('❀ La URL del ícono debe comenzar con http:// o https://')
        }
        configUpdate.icon = newValue
        updateMessage = `✅ *Ícono actualizado*`
        break
        
      case 'canal':
      case 'channel':
        if (!newValue.includes('whatsapp.com/channel/')) {
          return m.reply('❀ Debe ser un enlace de canal de WhatsApp válido')
        }
        configUpdate.channel = newValue
        updateMessage = `✅ *Canal actualizado*`
        break
        
      case 'grupo':
      case 'group':
        if (!newValue.includes('chat.whatsapp.com/')) {
          return m.reply('❀ Debe ser un enlace de grupo de WhatsApp válido')
        }
        configUpdate.group = newValue
        updateMessage = `✅ *Grupo actualizado*`
        break
        
      case 'estado':
      case 'status':
      case 'bio':
        configUpdate.status = newValue
        updateMessage = `✅ *Estado/Bio actualizado*`
        break
        
      default:
        return m.reply(`❀ Opción no válida. Usa:\n${usedPrefix}editar ${botIndex + 1} <nombre|prefijo|banner|icono|canal|grupo|estado> <valor>`)
    }
    
    // Actualizar configuración del bot
    if (!selectedBot.config) selectedBot.config = {}
    selectedBot.config = { ...selectedBot.config, ...configUpdate }
    selectedBot.updated = new Date().toISOString()
    
    // Guardar cambios
    global.premiumBots[botPhone] = selectedBot
    if (global.savePremiumData) {
      global.savePremiumData()
    }
    
    // Aplicar cambios al bot si está conectado
    await applyBotConfig(botPhone, configUpdate)
    
    const response = `✨ *CONFIGURACIÓN ACTUALIZADA* ✨\n\n`
      + `🤖 Bot: *${selectedBot.label}*\n`
      + `📱 Número: +${botPhone}\n`
      + `${updateMessage}\n`
      + `📅 Actualizado: ${new Date().toLocaleString('es-MX')}\n\n`
      + `*Los cambios se aplicarán automáticamente al bot.*`
    
    await conn.reply(m.chat, response, m)
    await m.react('✅')
    
  } catch (error) {
    await m.react('❌')
    console.error('Error editando bot:', error)
    m.reply(`❀ Error al editar: ${error.message}`)
  }
}

// Función para aplicar configuración a bot conectado
async function applyBotConfig(botPhone, config) {
  try {
    // Buscar conexión activa
    if (global.premiumConns) {
      const activeConn = global.premiumConns.find(conn => 
        conn.botConfig && conn.botConfig.phone === botPhone
      )
      
      if (activeConn && activeConn.user) {
        console.log(`⚙️ Aplicando configuración a bot +${botPhone}`)
        
        // Aquí puedes agregar código para aplicar cambios en tiempo real
        // Por ejemplo: cambiar nombre, bio, etc.
      }
    }
  } catch (error) {
    console.error('Error aplicando configuración:', error)
  }
}

handler.help = ['editar <número> <opción> <valor>', 'editar']
handler.tags = ['premium']
handler.command = ['editar', 'editarbot', 'configurar']
export default handler
