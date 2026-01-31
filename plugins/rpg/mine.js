// minar.js
import { addMissionProgress } from '../lib/daily-missions.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  if (!db.data.chats[m.chat].economy && m.isGroup) {
    return m.reply(`《✦》Los comandos de *Economía* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}economy on*`)
  }
  
  const user = global.db.data.users[m.sender]
  if (!user) return
  
  // Inicializar inventario y picos
  if (!user.inventory) user.inventory = { pickaxes: [] }
  if (!user.pickaxes) user.pickaxes = { normal: { durability: 100, multiplier: 1, level: 1 }, equipped: 'normal' }
  if (!user.materials) user.materials = { iron: 0, gold: 0, diamond: 0, emerald: 0, coal: 0 }
  
  user.lastmine = user.lastmine || 0
  user.coin = user.coin || 0
  user.exp = user.exp || 0
  user.health = user.health || 100
  
  // Verificar pico equipado
  const equippedPickaxe = user.pickaxes.equipped || 'normal'
  const pickaxeData = user.pickaxes[equippedPickaxe] || { durability: 100, multiplier: 1, level: 1 }
  
  if (user.health < 5) {
    return conn.reply(m.chat, `ꕥ No tienes suficiente salud para volver a *minar*.\n> Usa *"${usedPrefix}heal"* para curarte.`, m)
  }
  
  // Verificar durabilidad del pico
  if (pickaxeData.durability <= 0) {
    return conn.reply(m.chat, `🛠️ Tu pico está roto! Necesitas repararlo con: *${usedPrefix}repair* o comprar uno nuevo.`, m)
  }
  
  const gap = 10 * 60 * 1000
  const now = Date.now()
  
  if (now < user.lastmine) {
    const restante = user.lastmine - now
    return conn.reply(m.chat, `ꕥ Debes esperar *${formatTime(restante)}* para usar *${usedPrefix + command}* de nuevo.`, m)
  }
  
  user.lastmine = now + gap
  
  // Reducir durabilidad
  pickaxeData.durability -= Math.floor(Math.random() * 5) + 1
  if (pickaxeData.durability < 0) pickaxeData.durability = 0
  
  // Aplicar multiplicador del pico
  const multiplier = pickaxeData.multiplier || 1
  const evento = pickRandom(eventos)
  
  let monedas, experiencia, salud, materials = {}
  
  if (evento.tipo === 'victoria') {
    const baseMonedas = Math.floor(Math.random() * 2001) + 7000
    monedas = Math.floor(baseMonedas * multiplier)
    experiencia = Math.floor(Math.random() * 91) + 10
    salud = Math.floor(Math.random() * 3) + 1
    
    // Materiales encontrados
    if (Math.random() < 0.4) materials.iron = Math.floor(Math.random() * 3) + 1
    if (Math.random() < 0.2) materials.gold = Math.floor(Math.random() * 2) + 1
    if (Math.random() < 0.05 && equippedPickaxe.includes('diamond')) materials.diamond = 1
    if (Math.random() < 0.03) materials.emerald = 1
    if (Math.random() < 0.6) materials.coal = Math.floor(Math.random() * 5) + 2
    
    // Agregar materiales al inventario
    for (const [mat, amount] of Object.entries(materials)) {
      user.materials[mat] = (user.materials[mat] || 0) + amount
    }
    
    user.coin += monedas
    user.exp += experiencia
    user.health -= salud
    
  } else {
    monedas = Math.floor(Math.random() * 2001) + 3000
    experiencia = Math.floor(Math.random() * 41) + 10
    salud = Math.floor(Math.random() * 5) + 1
    
    user.coin -= monedas
    user.exp -= experiencia
    user.health -= salud
    
    if (user.coin < 0) user.coin = 0
    if (user.exp < 0) user.exp = 0
  }
  
  if (user.health < 0) user.health = 0
  
  // Agregar progreso a misión
  const missionResult = addMissionProgress(user, 'mine')
  
  let mensaje = `❀ ${evento.mensaje}\n`
  mensaje += `💰 Ganancia: *¥${monedas.toLocaleString()} ${currency}*\n`
  mensaje += `⭐ EXP: +${experiencia}\n`
  mensaje += `❤️ Salud: -${salud} (${user.health}/100)\n`
  
  // Mostrar materiales encontrados
  if (Object.keys(materials).length > 0) {
    mensaje += `\n📦 *Materiales encontrados:*\n`
    for (const [mat, amount] of Object.entries(materials)) {
      const emoji = {
        iron: '🔩',
        gold: '💰',
        diamond: '💎',
        emerald: '💚',
        coal: '⚫'
      }[mat]
      mensaje += `${emoji} ${mat.charAt(0).toUpperCase() + mat.slice(1)}: x${amount}\n`
    }
  }
  
  mensaje += `\n🛠️ Pico: ${equippedPickaxe} (${pickaxeData.durability}/100 durabilidad)\n`
  
  if (missionResult.wasJustCompleted) {
    mensaje += `\n🎉 ¡Misión de minar completada! Usa *${usedPrefix}claim mine* para reclamar recompensa.`
  }
  
  await conn.reply(m.chat, mensaje, m)
}

handler.help = ['minar']
handler.tags = ['economy']
handler.command = ['minar', 'miming', 'mine']
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

const eventos = [
  { tipo: 'victoria', mensaje: 'Descubriste una veta de oro entre rocas inestables y lograste extraerla con éxito.' },
  { tipo: 'victoria', mensaje: 'Hallaste una cámara secreta con gemas ocultas por siglos.' },
  { tipo: 'victoria', mensaje: 'Te cruzaste con un minero anciano que compartió herramientas y conocimientos valiosos.' },
  { tipo: 'victoria', mensaje: 'Excavaste un túnel olvidado y encontraste un cofre de minerales raros.' },
  { tipo: 'victoria', mensaje: 'Encontraste una cueva iluminada por cristales naturales que revelaban un tesoro oculto.' },
  { tipo: 'victoria', mensaje: 'Un golem de piedra te dio acceso a una sala de esmeraldas tras superar su acertijo.' },
  { tipo: 'victoria', mensaje: 'Minaste junto a otros exploradores y compartieron contigo los beneficios de una fuente mágica.' },
  { tipo: 'victoria', mensaje: 'Tras horas de excavación, hallaste una cámara sellada repleta de piedras lunares.' },
  { tipo: 'victoria', mensaje: 'Tu pico tocó una superficie metálica: era un cofre con monedas antiguas de gran valor.' },
  { tipo: 'victoria', mensaje: 'Siguiendo un mapa maltratado, diste con una cavidad llena de rubíes.' },
  { tipo: 'derrota', mensaje: 'Tus herramientas se rompieron justo antes de descubrir un filón valioso. Te retiraste con las manos vacías.' },
  { tipo: 'derrota', mensaje: 'Una explosión de gas te sorprendió y te hizo perder parte del botín mientras escapabas.' },
  { tipo: 'derrota', mensaje: 'La cueva colapsó parcialmente y tus minerales quedaron enterrados.' },
  { tipo: 'derrota', mensaje: 'Te atacaron murciélagos cegadores y saliste herido sin completar la recolección.' },
  { tipo: 'derrota', mensaje: 'Una trampa antigua se activó y dañó tu mochila, perdiendo varias gemas.' }
]