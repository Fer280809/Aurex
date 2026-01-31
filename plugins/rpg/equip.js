// equip.js
let handler = async (m, { conn, usedPrefix, text }) => {
  let user = global.db.data.users[m.sender]
  
  if (!text) {
    return conn.reply(m.chat, `📝 *Uso:* ${usedPrefix}equip [item_id]\nEjemplo: ${usedPrefix}equip pickaxe_iron`, m)
  }
  
  const itemId = text.toLowerCase()
  let response = ''
  
  // Verificar si es un pico
  if (user.pickaxes && user.pickaxes[itemId]) {
    user.pickaxes.equipped = itemId
    const pickaxe = user.pickaxes[itemId]
    response = `✅ *PICO EQUIPADO*\n\n`
    response += `⛏️ ${itemId.replace('pickaxe_', '').toUpperCase()}\n`
    response += `Durabilidad: ${pickaxe.durability}/100\n`
    response += `Multiplicador: x${pickaxe.multiplier || 1}\n`
  }
  // Verificar si es un arma
  else if (user.weapons && user.weapons[itemId]) {
    user.weapons.equipped = itemId
    const weapon = user.weapons[itemId]
    response = `✅ *ARMA EQUIPADA*\n\n`
    response += `🏹 ${itemId.replace('_', ' ').toUpperCase()}\n`
    response += `Durabilidad: ${weapon.durability}/100\n`
    response += `Daño: ${weapon.damage || 10}\n`
  }
  // Verificar si es una hacha
  else if (user.tools && user.tools[itemId]) {
    user.tools.equipped = itemId
    const tool = user.tools[itemId]
    response = `✅ *HACHA EQUIPADA*\n\n`
    response += `🪓 ${itemId.replace('axe_', '').toUpperCase()}\n`
    response += `Durabilidad: ${tool.durability}/100\n`
  }
  else {
    response = `❌ No tienes este item en tu inventario.\n`
    response += `Usa *${usedPrefix}inventory* para ver tus items.\n`
    response += `Usa *${usedPrefix}tienda* para comprar nuevos items.`
  }
  
  conn.reply(m.chat, response, m)
}

handler.command = ['equip', 'equipar']
handler.tags = ['economy']
handler.help = ['equip [id] - Equipar una herramienta']

export default handler