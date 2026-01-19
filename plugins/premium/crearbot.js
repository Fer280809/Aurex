import fs from 'fs'
import path from 'path'
import qrcode from 'qrcode'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const senderDigits = m.sender.split('@')[0]
  
  // Verificar premium
  if (!global.premiumUsers || !global.premiumUsers.includes(senderDigits)) {
    if (!global.owner || !global.owner.map(v => v.replace(/\D/g, '')).includes(senderDigits)) {
      return m.reply('❀ Solo usuarios premium pueden usar este comando.')
    }
  }
  
  const botPhone = args[0]
  const label = args.slice(1).join(' ') || `Bot de ${m.name || 'Usuario'}`
  
  if (!botPhone) {
    return m.reply(`❀ Uso: ${usedPrefix}crearbot <número> [nombre]`)
  }
  
  try {
    await m.react('🕒')
    
    let botDigits = botPhone.replace(/\D/g, '')
    if (botDigits.length === 10) botDigits = '52' + botDigits
    
    // Crear sesión básica
    const sessionDir = path.join('Sessions', 'Premium', senderDigits, botDigits)
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true })
    }
    
    // Guardar en base de datos
    if (!global.premiumBots) global.premiumBots = {}
    
    global.premiumBots[botDigits] = {
      owner: senderDigits,
      phone: botDigits,
      label: label,
      created: new Date().toISOString(),
      status: 'pending'
    }
    
    if (global.savePremiumData) {
      global.savePremiumData()
    }
    
    const message = `✨ *BOT CREADO* ✨

✅ Nombre: ${label}
✅ Número: +${botDigits}
📅 Fecha: ${new Date().toLocaleDateString()}

⚠️ *Sistema premium en desarrollo*
Por ahora, usa el comando normal /serbot o /qr para crear bots.

Próximamente: Panel web completo.`
    
    await conn.reply(m.chat, message, m)
    await m.react('✅')
    
  } catch (error) {
    await m.react('❌')
    m.reply(`❀ Error: ${error.message}`)
  }
}

handler.help = ['crearbot <número> [nombre]']
handler.tags = ['premium']
handler.command = ['crearbot', 'createsubbot']
export default handler
