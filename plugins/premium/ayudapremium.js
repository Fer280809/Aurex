let handler = async (m, { conn, usedPrefix }) => {
  const senderDigits = m.sender.split('@')[0]
  
  // Verificar premium (pero mostrar ayuda a todos)
  const isPremiumUser = global.premiumUsers && global.premiumUsers.includes(senderDigits)
  const isOwner = global.owner && global.owner.map(v => v.replace(/\D/g, '')).includes(senderDigits)
  
  let message = `🌟 *AYUDA - COMANDOS PREMIUM* 🌟\n\n`
  
  if (!isPremiumUser && !isOwner) {
    message += `ℹ️ *Esta es la lista de comandos premium.*\n`
    message += `*Para acceder a ellos, necesitas ser usuario premium.*\n\n`
    message += `*¿Cómo ser premium?*\n`
    message += `Contacta al propietario del bot usando:\n`
    message += `• ${usedPrefix}owner\n`
    message += `• ${usedPrefix}creator\n\n`
  }
  
  message += `📋 *COMANDOS DE GESTIÓN:*\n`
  message += `• ${usedPrefix}crearbot <número> [nombre] - Crear bot premium\n`
  message += `• ${usedPrefix}misbots - Ver tus bots premium\n`
  message += `• ${usedPrefix}eliminarbot <número> - Eliminar bot\n`
  message += `• ${usedPrefix}reiniciar <número> - Reiniciar bot\n\n`
  
  message += `⚙️ *COMANDOS DE CONFIGURACIÓN:*\n`
  message += `• ${usedPrefix}editar <número> <opción> <valor> - Editar bot\n`
  message += `• ${usedPrefix}verconfig [número] - Ver configuración\n`
  message += `• ${usedPrefix}cambiarnombre <número> <nombre> - Cambiar nombre\n`
  message += `• ${usedPrefix}cambiarprefijo <número> <prefijo> - Cambiar prefijo\n`
  message += `• ${usedPrefix}estadobot [número] - Ver estado detallado\n\n`
  
  message += `🌐 *PANEL WEB:*\n`
  message += `• ${usedPrefix}panel - Acceso al panel web premium\n\n`
  
  message += `📝 *OPCIONES DE EDICIÓN:*\n`
  message += `• nombre - Nombre del bot\n`
  message += `• prefijo - Prefijo de comandos (ej: ., !, #)\n`
  message += `• banner - URL del banner/imagen principal\n`
  message += `• icono - URL del ícono del bot\n`
  message += `• canal - Enlace del canal de WhatsApp\n`
  message += `• grupo - Enlace del grupo de soporte\n`
  message += `• estado - Estado/Bio del bot\n\n`
  
  message += `💎 *BENEFICIOS PREMIUM:*\n`
  const features = global.premiumFeatures || {}
  message += `• Máximo de bots: ${features.maxSubBots || 5}\n`
  message += `• Panel web completo\n`
  message += `• Reconexión automática 24/7\n`
  message += `• Personalización total\n`
  message += `• Soporte prioritario\n\n`
  
  message += `📞 *SOPORTE:*\n`
  message += `Si tienes problemas, usa:\n`
  message += `• ${usedPrefix}report <problema>\n`
  message += `• ${usedPrefix}owner (contactar propietario)\n\n`
  
  message += `✨ *¡Disfruta de tu experiencia premium!* ✨`
  
  await conn.reply(m.chat, message, m)
}

handler.help = ['ayudapremium', 'helppremium', 'premiumhelp']
handler.tags = ['premium']
handler.command = ['ayudapremium', 'helppremium', 'premiumhelp', 'premium']
export default handler