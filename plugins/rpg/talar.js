// talar.js
import { addMissionProgress } from '../lib/daily-missions.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  if (!db.data.chats[m.chat].economy && m.isGroup) {
    return m.reply(`《✦》Los comandos de *Economía* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}economy on*`)
  }
  
  const user = global.db.data.users[m.sender]
  if (!user) return
  
  // Inicializar inventario
  if (!user.inventory) user.inventory = { tools: [] }
  if (!user.wood) user.wood = { normal: 0, oak: 0, mahogany: 0 }
  if (!user.tools) user.tools = { axe: { durability: 100, multiplier: 1, level: 1 }, equipped: 'axe' }
  
  user.lastchop = user.lastchop || 0
  user.coin = user.coin || 0
  user.exp = user.exp || 0
  user.health = user.health || 100
  
  if (user.health < 5) {
    return conn.reply(m.chat, `ꕥ No tienes suficiente salud para *talar*.\n> Usa *"${usedPrefix}heal"* para curarte.`, m)
  }
  
  // Verificar hacha
  const axeData = user.tools.axe || { durability: 100, multiplier: 1, level: 1 }
  if (axeData.durability <= 0) {
    return conn.reply(m.chat, `🪓 Tu hacha está rota! Necesitas repararla con: *${usedPrefix}repair*`, m)
  }
  
  const cooldown = 12 * 60 * 1000
  const now = Date.now()
  
  if (now < user.lastchop) {
    const restante = user.lastchop - now
    return conn.reply(m.chat, `ꕥ Debes esperar *${formatTime(restante)}* para usar *${usedPrefix + command}* de nuevo.`, m)
  }
  
  user.lastchop = now + cooldown
  
  // Reducir durabilidad
  axeData.durability -= Math.floor(Math.random() * 4) + 2
  if (axeData.durability < 0) axeData.durability = 0
  
  // Resultado
  const resultado = pickRandom(resultadosTalar)
  const multiplier = axeData.multiplier || 1
  
  let monedas, experiencia, salud, madera = {}
  
  if (resultado.tipo === 'victoria') {
    const baseMonedas = Math.floor(Math.random() * 1501) + 4000
    monedas = Math.floor(baseMonedas * multiplier)
    experiencia = Math.floor(Math.random() * 61) + 20
    salud = Math.floor(Math.random() * 4) + 2
    
    // Madera obtenida
    const woodTypes = ['normal', 'oak', 'mahogany']
    const woodType = woodTypes[Math.floor(Math.random() * woodTypes.length)]
    const woodAmount = Math.floor(Math.random() * 5) + 3
    
    madera[woodType] = woodAmount
    user.wood[woodType] = (user.wood[woodType] || 0) + woodAmount
    
    user.coin += monedas
    user.exp += experiencia
    user.health -= salud
    
  } else {
    monedas = Math.floor(Math.random() * 1001) + 2000
    experiencia = Math.floor(Math.random() * 31) + 15
    salud = Math.floor(Math.random() * 5) + 3
    
    user.coin -= monedas
    user.exp -= experiencia
    user.health -= salud
    
    if (user.coin < 0) user.coin = 0
    if (user.exp < 0) user.exp = 0
  }
  
  if (user.health < 0) user.health = 0
  
  // Agregar progreso a misión (crear misión de talar en daily-missions.js)
  const missionResult = addMissionProgress(user, 'chop')
  
  let mensaje = `🪓 ${resultado.mensaje}\n`
  mensaje += `💰 Ganancia: *¥${monedas.toLocaleString()} ${currency}*\n`
  mensaje += `⭐ EXP: ${monedas > 0 ? '+' : ''}${experiencia}\n`
  mensaje += `❤️ Salud: -${salud} (${user.health}/100)\n`
  
  // Mostrar madera obtenida
  if (Object.keys(madera).length > 0) {
    mensaje += `\n🌲 *Madera obtenida:*\n`
    for (const [type, amount] of Object.entries(madera)) {
      const names = { normal: 'Madera común', oak: 'Roble', mahogany: 'Caoba' }
      mensaje += `🪵 ${names[type]}: x${amount}\n`
    }
  }
  
  mensaje += `\n🪓 Hacha: (${axeData.durability}/100 durabilidad)\n`
  
  await conn.reply(m.chat, mensaje, m)
}

handler.help = ['talar']
handler.tags = ['economy']
handler.command = ['talar', 'chop', 'cortar']
handler.group = true

export default handler

function formatTime(ms) {
  const totalSec = Math.ceil(ms / 1000)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  const parts = []
  if (minutes > 0) parts.push(`${minutes} minuto${minutes !== 1 ? 's' : ''}`)
  parts.push(`${seconds} segundo${seconds !== 1 ? 's' : ''}`)
  return parts.join(' ')
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

const resultadosTalar = [
  { tipo: 'victoria', mensaje: 'Encontraste un árbol antiguo con madera de alta calidad.' },
  { tipo: 'victoria', mensaje: 'Descubriste un bosque secreto de árboles mágicos.' },
  { tipo: 'victoria', mensaje: 'Talaste con precisión un roble centenario.' },
  { tipo: 'victoria', mensaje: 'Un leñador experto te enseñó técnicas avanzadas.' },
  { tipo: 'victoria', mensaje: 'Encontraste madera petrificada de gran valor.' },
  { tipo: 'derrota', mensaje: 'El árbol cayó en dirección equivocada y dañó tu equipo.' },
  { tipo: 'derrota', mensaje: 'Encontraste hormigas carpinteras que arruinaron la madera.' },
  { tipo: 'derrota', mensaje: 'Una rama pesada cayó y te lastimó.' },
  { tipo: 'derrota', mensaje: 'El hacha se atascó en un nudo difícil.' }
]