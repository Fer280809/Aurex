import { createPremiumBot, startPremiumBot } from '../sockets-premium.js'

let handler = async (m, { conn, args, usedPrefix, command, isROwner }) => {
  // Verificar si es usuario premium
  const senderDigits = m.sender.split('@')[0]
  const isPremium = global.premiumUsers.includes(senderDigits) || 
                   global.owner.map(v => v.replace(/\D/g, '')).includes(senderDigits)
  
  if (!isPremium) {
    return m.reply(`❀ Este comando es exclusivo para usuarios premium.\nContacta al propietario para adquirir premium.`)
  }
  
  const botPhone = args[0]
  const label = args.slice(1).join(' ') || `Bot de ${m.name}`
  
  if (!botPhone) {
    return m.reply(`❀ Uso: ${usedPrefix}crearbot <número> [nombre]\nEj: ${usedPrefix}crearbot 521234567890 Mi Bot Premium`)
  }
  
  try {
    await m.react('🕒')
    
    // Crear bot premium
    const botConfig = await createPremiumBot(senderDigits, botPhone, label)
    
    // Iniciar bot para generar QR
    const sock = await startPremiumBot(botPhone)
    
    // Enviar mensaje con instrucciones
    const message = `✨ *BOT PREMIUM CREADO* ✨

✅ *Nombre:* ${label}
✅ *Número:* +${botPhone}
✅ *Propietario:* @${m.sender.split('@')[0]}
✅ *Fecha:* ${new Date().toLocaleDateString('es-MX')}

📱 *Para conectar:*
1. Ve a WhatsApp > Ajustes
2. Dispositivos vinculados
3. Escanea el código QR
4. ¡Listo! Tu bot estará funcionando

🌐 *Panel de control:* http://localhost:3000
🔧 *Para editar configuración:* Usa el panel web

*Recuerda:* Tu bot premium tiene reconexión automática y características exclusivas.`
    
    await conn.reply(m.chat, message, m, { mentions: [m.sender] })
    await m.react('✅')
    
    // Intentar enviar QR por WhatsApp
    setTimeout(async () => {
      try {
        const qrPath = botConfig.sessionPath + '/qr.png'
        if (fs.existsSync(qrPath)) {
          await conn.sendFile(m.chat, qrPath, 'qr.png', 'Escanea este QR para conectar tu bot premium', m)
        }
      } catch (e) {
        console.log('No se pudo enviar QR:', e.message)
      }
    }, 2000)
    
  } catch (error) {
    await m.react('❌')
    m.reply(`❀ Error: ${error.message}`)
  }
}

handler.help = ['crearbot <número> [nombre]']
handler.tags = ['premium']
handler.command = ['crearbot', 'createsubbot']
export default handler
