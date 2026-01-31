// inventory.js
let handler = async (m, { conn, usedPrefix }) => {
  let user = global.db.data.users[m.sender]
  
  let text = `🎒 *INVENTARIO DE @${m.sender.split('@')[0]}*\n\n`
  
  // Dinero y stats básicas
  text += `💰 Dinero: ¥${(user.coin || 0).toLocaleString()}\n`
  text += `🏦 Banco: ¥${(user.bank || 0).toLocaleString()}\n`
  text += `❤️ Salud: ${user.health || 100}/100\n`
  text += `⭐ EXP: ${user.exp || 0}\n\n`
  
  // Picos equipados
  text += `*⛏️ PICOS DISPONIBLES:*\n`
  if (user.pickaxes) {
    const equipped = user.pickaxes.equipped || 'normal'
    for (const [id, data] of Object.entries(user.pickaxes)) {
      if (id !== 'equipped' && typeof data === 'object') {
        text += `${id === equipped ? '✅ ' : ''}${id.replace('pickaxe_', '').toUpperCase()}: `
        text += `${data.durability}/100 durabilidad | x${data.multiplier || 1}\n`
      }
    }
  }
  text += `\n`
  
  // Armas
  text += `*🏹 ARMAS DISPONIBLES:*\n`
  if (user.weapons) {
    const equipped = user.weapons.equipped || 'bow'
    for (const [id, data] of Object.entries(user.weapons)) {
      if (id !== 'equipped' && typeof data === 'object') {
        text += `${id === equipped ? '✅ ' : ''}${id.replace('_', ' ').toUpperCase()}: `
        text += `${data.durability}/100 durabilidad | ${data.damage || 10} daño\n`
      }
    }
  }
  text += `\n`
  
  // Materiales
  text += `*📦 MATERIALES:*\n`
  if (user.materials) {
    for (const [mat, amount] of Object.entries(user.materials)) {
      if (amount > 0) {
        const emoji = { iron: '🔩', gold: '💰', diamond: '💎', emerald: '💚', coal: '⚫' }[mat]
        text += `${emoji || '📦'} ${mat}: x${amount}\n`
      }
    }
  }
  
  // Madera
  if (user.wood) {
    for (const [type, amount] of Object.entries(user.wood)) {
      if (amount > 0) {
        text += `🪵 ${type}: x${amount}\n`
      }
    }
  }
  
  // Botín de caza
  if (user.loot) {
    for (const [item, amount] of Object.entries(user.loot)) {
      if (amount > 0) {
        const icons = { leather: '🐮', meat: '🥩', fangs: '🦷', feathers: '🪶', horn: '🦌' }
        text += `${icons[item] || '📦'} ${item}: x${amount}\n`
      }
    }
  }
  
  // Items del inventario
  if (user.inventory && user.inventory.items && user.inventory.items.length > 0) {
    text += `\n*📋 ITEMS ESPECIALES:*\n`
    user.inventory.items.forEach(item => {
      text += `• ${item.name}\n`
    })
  }
  
  // Árboles plantados
  if (user.trees && user.trees.length > 0) {
    text += `\n*🌳 ÁRBOLES PLANTADOS:*\n`
    user.trees.forEach((tree, i) => {
      const planted = new Date(tree.planted)
      const hours = Math.floor((Date.now() - planted) / (1000 * 60 * 60))
      const growth = Math.min(100, Math.floor((hours / tree.growthTime) * 100))
      text += `• ${tree.name}: ${growth}% crecido\n`
    })
  }
  
  text += `\n📝 *Comandos útiles:*\n`
  text += `• ${usedPrefix}equip [item] - Equipar herramienta\n`
  text += `• ${usedPrefix}repair - Reparar herramientas\n`
  text += `• ${usedPrefix}craft - Crear objetos\n`
  
  conn.reply(m.chat, text, m, {
    mentions: [m.sender]
  })
}

handler.command = ['inventory', 'inv', 'inventario']
handler.tags = ['economy']
handler.help = ['inventory - Ver tu inventario']

export default handler