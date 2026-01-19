let handler = async (m, { conn, args, usedPrefix, command }) => {
  const senderDigits = m.sender.split('@')[0]
  
  // Verificar premium
  if (!global.premiumUsers || !global.premiumUsers.includes(senderDigits)) {
    if (!global.owner || !global.owner.map(v => v.replace(/\D/g, '')).includes(senderDigits)) {
      return m.reply('❀ Solo usuarios premium pueden usar este comando.')
    }
  }
  
  const botIndex = parseInt(args[0]) - 1
  
  if (isNaN(botIndex)) {
    return m.reply(`❀ Uso: ${usedPrefix}reiniciar <número bot>\nEj: ${usedPrefix}reiniciar 1\nUsa *${usedPrefix}misbots* para ver la lista.`)
  }
  
  // Obtener bots del usuario
  let userBots = []
  if (global.premiumBots) {
    userBots = Object.values(global.premiumBots).filter(bot => 
      bot.owner === senderDigits
    )
  }
  
  if (botIndex < 0 || botIndex >= userBots.length) {
    return m.reply(`❀ Número de bot inválido.`)
  }
  
  const bot = userBots[botIndex]
  
  try {
    await m.react('🔄')
    
    // Importar función para reiniciar
    const { startPremiumBot } = await import('../sockets/premium.js')
    
    // Cerrar conexión actual si existe
    if (global.premiumConns) {
      const connIndex = global.premiumConns.findIndex(conn => 
        conn.botConfig && conn.botConfig.phone === bot.phone
      )
      
      if (connIndex !== -1) {
        try {
          global.premiumConns[connIndex].ws.close()
          global.premiumConns.splice(connIndex, 1)
        } catch (e) {
          console.log('Error cerrando conexión:', e)
        }
      }
    }
    
    // Actualizar estado
    bot.status = 'reiniciando'
    global.premiumBots[bot.phone] = bot
    if (global.savePremiumData) {
      global.savePremiumData()
    }
    
    await m.reply(`🔄 *REINICIANDO BOT*...\n\n🤖 Bot: +${bot.phone}\n📛 Nombre: ${bot.label}\n⏳ Por favor espera...`)
    
    // Reiniciar bot
    setTimeout(async () => {
      try {
        await startPremiumBot(bot.phone)
        
        const successMessage = `✅ *BOT REINICIADO EXITOSAMENTE*\n\n`
          + `🤖 Bot: +${bot.phone}\n`
          + `📛 Nombre: ${bot.label}\n`
          + `🔌 Estado: Reconectando...\n`
          + `👤 Propietario: @${m.sender.split('@')[0]}\n`
          + `⏰ Fecha: ${new Date().toLocaleString('es-MX')}\n\n`
          + `*El bot se conectará automáticamente en unos segundos.*`
        
        await conn.reply(m.chat, successMessage, m, { mentions: [m.sender] })
        await m.react('✅')
        
      } catch (error) {
        console.error('Error reiniciando bot:', error)
        
        bot.status = 'error'
        global.premiumBots[bot.phone] = bot
        if (global.savePremiumData) {
          global.savePremiumData()
        }
        
        await m.reply(`❌ *ERROR AL REINICIAR*\n\nBot: +${bot.phone}\nError: ${error.message}\n\nIntenta usar el panel web para reconectar.`)
        await m.react('❌')
      }
    }, 2000)
    
  } catch (error) {
    await m.react('❌')
    m.reply(`❀ Error: ${error.message}`)
  }
}

handler.help = ['reiniciar <número bot>']
handler.tags = ['premium']
handler.command = ['reiniciar', 'restartbot', 'reboot']
export default handler