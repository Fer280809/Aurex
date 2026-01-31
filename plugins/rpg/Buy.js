// buy.js
let handler = async (m, { conn, usedPrefix, text }) => {
  let user = global.db.data.users[m.sender]
  
  if (!text) {
    return conn.reply(m.chat, `📝 *Uso:* ${usedPrefix}buy [id_item]\nEjemplo: ${usedPrefix}buy pickaxe_iron\n\nUsa ${usedPrefix}tienda para ver los items disponibles.`, m)
  }
  
  // Definir items de la tienda
  const shopItems = {
    // Picos
    'pickaxe_basic': { type: 'pickaxe', name: '⛏️ Pico básico', price: 5000, durability: 100, multiplier: 1 },
    'pickaxe_iron': { type: 'pickaxe', name: '⛏️ Pico de hierro', price: 15000, durability: 150, multiplier: 1.5 },
    'pickaxe_gold': { type: 'pickaxe', name: '⛏️ Pico de oro', price: 50000, durability: 120, multiplier: 2 },
    'pickaxe_diamond': { type: 'pickaxe', name: '💎 Pico de diamante', price: 150000, durability: 200, multiplier: 3 },
    'pickaxe_legendary': { type: 'pickaxe', name: '✨ Pico legendario', price: 500000, durability: 300, multiplier: 5 },
    
    // Hachas
    'axe_basic': { type: 'axe', name: '🪓 Hacha básica', price: 3000, durability: 100, multiplier: 1 },
    'axe_iron': { type: 'axe', name: '🪓 Hacha de hierro', price: 10000, durability: 150, multiplier: 1.5 },
    'axe_diamond': { type: 'axe', name: '💎 Hacha de diamante', price: 75000, durability: 200, multiplier: 2.5 },
    
    // Armas
    'bow_basic': { type: 'weapon', name: '🏹 Arco básico', price: 8000, damage: 10, durability: 100 },
    'crossbow': { type: 'weapon', name: '🏹 Ballesta', price: 30000, damage: 25, durability: 120 },
    'rifle': { type: 'weapon', name: '🔫 Rifle', price: 100000, damage: 50, durability: 150 },
    'shotgun': { type: 'weapon', name: '🔫 Escopeta', price: 150000, damage: 40, durability: 100 },
    
    // Árboles
    'tree_oak': { type: 'tree', name: '🌳 Roble', price: 5000, growTime: 24, yield: 'oak' },
    'tree_mahogany': { type: 'tree', name: '🌳 Caoba', price: 15000, growTime: 48, yield: 'mahogany' },
    'tree_magic': { type: 'tree', name: '🌳 Árbol mágico', price: 50000, growTime: 72, yield: 'magic_wood' },
    
    // Mejoras
    'health_potion': { type: 'upgrade', name: '🧪 Poción de salud', price: 5000, effect: 'heal', amount: 50 },
    'repair_kit': { type: 'upgrade', name: '🔧 Kit de reparación', price: 10000, effect: 'repair' },
    'backpack': { type: 'upgrade', name: '🎒 Mochila grande', price: 20000, effect: 'expand_inventory' }
  }
  
  const itemId = text.toLowerCase()
  const item = shopItems[itemId]
  
  if (!item) {
    return conn.reply(m.chat, `❌ Item no encontrado. Usa *${usedPrefix}tienda* para ver los items disponibles.`, m)
  }
  
  if ((user.coin || 0) < item.price) {
    return conn.reply(m.chat, `❌ No tienes suficiente dinero.\nNecesitas: ¥${item.price.toLocaleString()}\nTienes: ¥${(user.coin || 0).toLocaleString()}`, m)
  }
  
  // Comprar item
  user.coin -= item.price
  
  // Procesar según tipo de item
  switch (item.type) {
    case 'pickaxe':
      if (!user.pickaxes) user.pickaxes = {}
      user.pickaxes[itemId] = {
        durability: item.durability,
        multiplier: item.multiplier,
        level: 1,
        purchased: new Date().toISOString()
      }
      break
      
    case 'axe':
      if (!user.tools) user.tools = {}
      user.tools[itemId] = {
        durability: item.durability,
        multiplier: item.multiplier,
        level: 1
      }
      break
      
    case 'weapon':
      if (!user.weapons) user.weapons = {}
      user.weapons[itemId] = {
        durability: item.durability,
        damage: item.damage,
        level: 1
      }
      break
      
    case 'tree':
      if (!user.trees) user.trees = []
      user.trees.push({
        id: itemId,
        name: item.name,
        planted: new Date().toISOString(),
        growth: 0,
        yield: item.yield
      })
      break
      
    case 'upgrade':
      if (!user.inventory) user.inventory = { items: [] }
      if (!user.inventory.items) user.inventory.items = []
      user.inventory.items.push({
        id: itemId,
        name: item.name,
        type: 'upgrade'
      })
      
      // Aplicar efecto inmediato
      if (item.effect === 'heal') {
        user.health = Math.min(100, (user.health || 100) + item.amount)
      }
      break
  }
  
  let response = `✅ *COMPRA EXITOSA*\n\n`
  response += `📦 Item: ${item.name}\n`
  response += `💰 Precio: ¥${item.price.toLocaleString()}\n`
  response += `💵 Dinero restante: ¥${user.coin.toLocaleString()}\n\n`
  
  if (item.type === 'pickaxe') {
    response += `🔧 Pico agregado a tu inventario.\n`
    response += `Usa *${usedPrefix}equip ${itemId}* para equiparlo.\n`
  } else if (item.type === 'weapon') {
    response += `🏹 Arma agregada a tu inventario.\n`
    response += `Usa *${usedPrefix}equip ${itemId}* para equiparla.\n`
  } else if (item.type === 'tree') {
    response += `🌳 Árbol listo para plantar.\n`
    response += `Usa *${usedPrefix}plant ${itemId}* para plantarlo.\n`
  } else if (item.type === 'upgrade' && item.effect === 'heal') {
    response += `❤️ Salud restaurada: +${item.amount} puntos.\n`
  }
  
  conn.reply(m.chat, response, m)
}

handler.command = ['buy', 'comprar']
handler.tags = ['economy']
handler.help = ['buy [id] - Comprar un item de la tienda']

export default handler