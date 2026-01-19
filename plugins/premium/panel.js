let handler = async (m, { conn }) => {
  const senderDigits = m.sender.split('@')[0]
  const isPremium = global.premiumUsers.includes(senderDigits) || 
                   global.owner.map(v => v.replace(/\D/g, '')).includes(senderDigits)
  
  if (!isPremium) {
    return m.reply(`❀ Este comando es exclusivo para usuarios premium.`)
  }
  
  const panelUrl = 'http://localhost:3000'
  
  const message = `🌐 *PANEL PREMIUM ASTA BOT* 🌐

🔗 *URL de acceso:* ${panelUrl}

📋 *Características del panel:*
• Crear y eliminar bots
• Editar configuración completa
• Ver estado de conexión
• Generar códigos QR
• Estadísticas de uso
• Gestión de sesiones

👤 *Tu usuario:* +${senderDigits}
🔑 *Token de acceso:* ${senderDigits}

*Instrucciones:*
1. Accede a la URL desde cualquier navegador
2. Ingresa tu número (${senderDigits})
3. ¡Comienza a administrar tus bots!

*Nota:* Asegúrate de estar en la misma red.`
  
  await conn.reply(m.chat, message, m)
}

handler.help = ['panel']
handler.tags = ['premium']
handler.command = ['panel', 'webpanel', 'dashboard']
export default handler
