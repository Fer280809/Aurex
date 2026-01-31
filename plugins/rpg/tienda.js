// tienda.js
let handler = async (m, { conn, usedPrefix }) => {
  let user = global.db.data.users[m.sender]
  
  const tienda = {
    // Picos de minar
    pickaxes: [
      { id: 'pickaxe_basic', name: '⛏️ Pico básico', price: 5000, durability: 100, multiplier: 1, description: 'Pico estándar para principiantes' },
      { id: 'pickaxe_iron', name: '⛏️ Pico de hierro', price: 15000, durability: 150, multiplier: 1.5, description: 'Más duradero y eficiente' },
      { id: 'pickaxe_gold', name: '⛏️ Pico de oro', price: 50000, durability: 120, multiplier: 2, description: 'Encuentra más oro' },
      { id: 'pickaxe_diamond', name: '💎 Pico de diamante', price: 150000, durability: 200, multiplier: 3, description: 'El mejor para minar gemas' },
      { id: 'pickaxe_legendary', name: '✨ Pico legendario', price: 500000, durability: 300, multiplier: 5, description: '¡Duplica todos los materiales!' }
    ],
    
    // Hachas para talar
    axes: [
      { id: 'axe_basic', name: '🪓 Hacha básica', price: 3000, durability: 100, multiplier: 1, description: 'Para talar árboles comunes' },
      { id: 'axe_iron', name: '🪓 Hacha de hierro', price: 10000, durability: 150, multiplier: 1.5, description: 'Más rápida y eficiente' },
      { id: 'axe_diamond', name: '💎 Hacha de diamante', price: 75000, durability: 200, multiplier: 2.5, description: 'Corta los árboles más duros' }
    ],
    
    // Armas para cazar
    weapons: [
      { id: 'bow_basic', name: '🏹 Arco básico', price: 8000, damage: 10, durability: 100, description: 'Para cazar animales pequeños' },
      { id: 'crossbow', name: '🏹 Ballesta', price: 30000, damage: 25, durability: 120, description: 'Mayor precisión y daño' },
      { id: 'rifle', name: '🔫 Rifle', price: 100000, damage: 50, durability: 150, description: 'Para cazar animales grandes' },
      { id: 'shotgun', name: '🔫 Escopeta', price: 150000, damage: 40, durability: 100, description: 'Daño en área, perfecta para manadas' }
    ],
    
    // Árboles para plantar
    trees: [
      { id: 'tree_oak', name: '🌳 Roble', price: 5000, growTime: 24, yield: 'oak', description: 'Produce madera de roble' },
      { id: 'tree_mahogany', name: '🌳 Caoba', price: 15000, growTime: 48, yield: 'mahogany', description: 'Madera de lujo' },
      { id: 'tree_magic', name: '🌳 Árbol mágico', price: 50000, growTime: 72, yield: 'magic_wood', description: 'Produce madera encantada' }
    ],
    
    // Mejoras
    upgrades: [
      { id: 'backpack', name: '🎒 Mochila grande', price: 20000, description: 'Aumenta capacidad de inventario' },
      { id: 'health_potion', name: '🧪 Poción de salud', price: 5000, description: 'Restaura 50 puntos de salud' },
      { id: 'repair_kit', name: '🔧 Kit de reparación', price: 10000, description: 'Repara cualquier herramienta al 100%' }
    ]
  }
  
  let text = `🛒 *TIENDA DE HERRAMIENTAS*\n\n`
  text += `💰 Tu dinero: ¥${(user.coin || 0).toLocaleString()}\n\n`
  
  text += `*⛏️ PICOS DE MINAR*\n`
  tienda.pickaxes.forEach(item => {
    text += `• ${item.name} - ¥${item.price.toLocaleString()}\n`
    text += `  ${item.description}\n`
    text += `  Durabilidad: ${item.durability} | Multiplicador: x${item.multiplier}\n`
    text += `  Comprar: *${usedPrefix}buy ${item.id}*\n\n`
  })
  
  text += `*🪓 HACHAS PARA TALAR*\n`
  tienda.axes.forEach(item => {
    text += `• ${item.name} - ¥${item.price.toLocaleString()}\n`
    text += `  ${item.description}\n`
    text += `  Comprar: *${usedPrefix}buy ${item.id}*\n\n`
  })
  
  text += `*🏹 ARMAS PARA CAZAR*\n`
  tienda.weapons.forEach(item => {
    text += `• ${item.name} - ¥${item.price.toLocaleString()}\n`
    text += `  ${item.description}\n`
    text += `  Daño: ${item.damage} | Durabilidad: ${item.durability}\n`
    text += `  Comprar: *${usedPrefix}buy ${item.id}*\n\n`
  })
  
  text += `*🌳 ÁRBOLES PARA PLANTAR*\n`
  tienda.trees.forEach(item => {
    text += `• ${item.name} - ¥${item.price.toLocaleString()}\n`
    text += `  ${item.description}\n`
    text += `  Tiempo de crecimiento: ${item.growTime}h\n`
    text += `  Comprar: *${usedPrefix}buy ${item.id}*\n\n`
  })
  
  text += `*🛠️ MEJORAS*\n`
  tienda.upgrades.forEach(item => {
    text += `• ${item.name} - ¥${item.price.toLocaleString()}\n`
    text += `  ${item.description}\n`
    text += `  Comprar: *${usedPrefix}buy ${item.id}*\n\n`
  })
  
  text += `📝 *Uso:* ${usedPrefix}buy [item_id] - Para comprar un item\n`
  text += `📦 *Uso:* ${usedPrefix}inventory - Para ver tu inventario\n`
  
  conn.reply(m.chat, text, m)
}

handler.command = ['tienda', 'shop', 'store']
handler.tags = ['economy']
handler.help = ['tienda - Ver items disponibles para comprar']

export default handler