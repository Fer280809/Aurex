let handler = async (m, { conn, args, usedPrefix, command, isROwner }) => {
  if (!isROwner) return m.reply(`❀ Este comando solo puede ser usado por el creador del bot.`)
  
  let target = args[0]
  if (!target && m.quoted) {
    target = m.quoted.sender.split('@')[0]
  } else if (m.mentionedJid && m.mentionedJid[0]) {
    target = m.mentionedJid[0].split('@')[0]
  }
  
  if (!target) return m.reply(`❀ Uso: ${usedPrefix}supprem <número o @usuario>\nEj: ${usedPrefix}supprem 521234567890`)
  
  // Normalizar número
  let phoneNumber = target.replace(/\D/g, '')
  if (phoneNumber.length === 10 && phoneNumber.startsWith('1')) {
    phoneNumber = '521' + phoneNumber.slice(1)
  } else if (phoneNumber.length === 10) {
    phoneNumber = '52' + phoneNumber
  }
  
  // Verificar si ya es premium
  if (global.premiumUsers.includes(phoneNumber)) {
    return m.reply(`❀ El usuario +${phoneNumber} ya es premium.`)
  }
  
  // Agregar como premium
  global.premiumUsers.push(phoneNumber)
  global.savePremiumData()
  
  // Mensaje de confirmación
  const message = `✨ *USUARIO PREMIUM AGREGADO* ✨

✅ *Usuario:* +${phoneNumber}
✅ *Agregado por:* @${m.sender.split('@')[0]}
✅ *Fecha:* ${new Date().toLocaleDateString('es-MX')}

📋 *Beneficios Premium:*
• Crear hasta ${global.premiumFeatures.maxSubBots} bots
• Panel web de administración
• Edición completa (nombre, banner, ícono)
• Prefijo personalizable
• Anti-eliminación de mensajes
• Reconexión automática
• Soporte prioritario

🌐 *Panel Web:* http://localhost:3000
🔑 *Token de acceso:* ${phoneNumber}

*El usuario recibirá un mensaje con las instrucciones.*`
  
  await conn.reply(m.chat, message, m, { mentions: [m.sender] })
  
  // Notificar al usuario premium
  try {
    await conn.sendMessage(`${phoneNumber}@s.whatsapp.net`, {
      text: `🎉 *¡FELICIDADES! ERES USUARIO PREMIUM* 🎉

Has sido agregado como *usuario premium* de *${global.botname}*.

*Tus beneficios exclusivos:*
✅ Crear hasta ${global.premiumFeatures.maxSubBots} bots propios
✅ Panel web de control completo
✅ Personalización total (nombre, banner, ícono)
✅ Prefijo personalizable
✅ Reconexión automática 24/7
✅ Anti-eliminación de mensajes
✅ Soporte prioritario

*Para empezar:*
1. Accede al panel: http://localhost:3000
2. Usa tu número como usuario: +${phoneNumber}
3. Crea tu primer bot premium

*Comandos disponibles:*
• ${usedPrefix}crearbot - Crear nuevo bot
• ${usedPrefix}misbots - Ver tus bots
• ${usedPrefix}panel - Acceso al panel web

¡Gracias por tu apoyo! 🚀`
    })
  } catch (e) {
    console.log('⚠ No se pudo notificar al usuario:', e.message)
  }
}

handler.help = ['supprem <número/@usuario>']
handler.tags = ['owner']
handler.command = ['supprem', 'addpremium', 'premiumadd']
handler.rowner = true

export default handler
