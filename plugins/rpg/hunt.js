// cazar.js
import { addMissionProgress } from '../lib/daily-missions.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  if (!global.db.data.chats[m.chat].economy && m.isGroup) {
    return m.reply(`《✦》Los comandos de *Economía* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}economy on*`)
  }
  
  let user = global.db.data.users[m.sender]
  if (!user) {
    global.db.data.users[m.sender] = { 
      exp: 0, 
      coin: 0, 
      bank: 0, 
      health: 100, 
      lastHunt: 0,
      inventory: { weapons: [] },
      weapons: { bow: { durability: 100, damage: 10, level: 1 }, equipped: 'bow' },
      loot: { leather: 0, meat: 0, fangs: 0, feathers: 0 }
    }
    user = global.db.data.users[m.sender]
  }
  
  // Inicializar
  if (!user.inventory) user.inventory = { weapons: [] }
  if (!user.weapons) user.weapons = { bow: { durability: 100, damage: 10, level: 1 }, equipped: 'bow' }
  if (!user.loot) user.loot = { leather: 0, meat: 0, fangs: 0, feathers: 0 }
  
  user.coin = user.coin || 0
  user.bank = user.bank || 0
  user.exp = user.exp || 0
  user.health = user.health || 100
  user.lastHunt = user.lastHunt || 0
  
  // Verificar arma equipada
  const equippedWeapon = user.weapons.equipped || 'bow'
  const weaponData = user.weapons[equippedWeapon] || { durability: 100, damage: 10, level: 1 }
  
  if (user.health < 5) {
    return conn.reply(m.chat, `ꕥ No tienes suficiente salud para volver a *cazar*.\n> Usa *"${usedPrefix}heal"* para curarte.`, m)
  }
  
  if (weaponData.durability <= 0) {
    return conn.reply(m.chat, `🏹 Tu ${equippedWeapon} está rota! Necesitas repararla con: *${usedPrefix}repair*`, m)
  }
  
  const cooldown = 15 * 60 * 1000
  const now = Date.now()
  
  if (now < user.lastHunt) {
    const restante = user.lastHunt - now
    return conn.reply(m.chat, `ꕥ Debes esperar *${formatTime(restante)}* para usar *${usedPrefix + command}* de nuevo.`, m)
  }
  
  user.lastHunt = now + cooldown
  
  // Reducir durabilidad
  weaponData.durability -= Math.floor(Math.random() * 3) + 1
  if (weaponData.durability < 0) weaponData.durability = 0
  
  // Determinar animal basado en arma
  const animal = getHuntableAnimal(equippedWeapon)
  const evento = getHuntEvent(animal)
  
  let monedas, experiencia, salud, loot = {}
  
  if (evento.tipo === 'victoria') {
    // Monedas basadas en daño del arma
    const baseMonedas = Math.floor(Math.random() * 10001) + 1000
    const weaponBonus = weaponData.damage * 500
    monedas = baseMonedas + weaponBonus
    
    experiencia = Math.floor(Math.random() * 91) + 30 + (weaponData.level * 10)
    salud = Math.floor(Math.random() * 5) + 3
    
    // Loot basado en animal
    loot = getAnimalLoot(animal)
    for (const [item, amount] of Object.entries(loot)) {
      user.loot[item] = (user.loot[item] || 0) + amount
    }
    
    user.coin += monedas
    user.exp += experiencia
    user.health -= salud
    
  } else {
    monedas = Math.floor(Math.random() * 2001) + 4000
    experiencia = Math.floor(Math.random() * 41) + 30
    salud = Math.floor(Math.random() * 5) + 3
    
    user.coin -= monedas
    user.exp -= experiencia
    user.health -= salud
    
    if (user.coin < 0) user.coin = 0
    if (user.exp < 0) user.exp = 0
  }
  
  if (user.health < 0) user.health = 0
  
  // Agregar progreso a misión
  const missionResult = addMissionProgress(user, 'hunt')
  
  let mensaje = `🏹 ${evento.mensaje}\n`
  mensaje += `🎯 Animal: ${animal.icon} ${animal.name}\n`
  mensaje += `💰 Ganancia: *¥${monedas.toLocaleString()} ${currency}*\n`
  mensaje += `⭐ EXP: ${monedas > 0 ? '+' : ''}${experiencia}\n`
  mensaje += `❤️ Salud: -${salud} (${user.health}/100)\n`
  mensaje += `⚔️ Arma: ${equippedWeapon} (${weaponData.durability}/100)\n`
  
  // Mostrar loot
  if (Object.keys(loot).length > 0) {
    mensaje += `\n🎒 *Botín obtenido:*\n`
    for (const [item, amount] of Object.entries(loot)) {
      const icons = { leather: '🐮', meat: '🥩', fangs: '🦷', feathers: '🪶', horn: '🦌' }
      const names = { leather: 'Cuero', meat: 'Carne', fangs: 'Colmillos', feathers: 'Plumas', horn: 'Cuerno' }
      mensaje += `${icons[item] || '📦'} ${names[item]}: x${amount}\n`
    }
  }
  
  if (missionResult.wasJustCompleted) {
    mensaje += `\n🎉 ¡Misión de cazar completada! Usa *${usedPrefix}claim hunt*`
  }
  
  conn.reply(m.chat, mensaje, m)
}

handler.tags = ['rpg']
handler.help = ['cazar', 'hunt']
handler.command = ['cazar', 'hunt']
handler.group = true

export default handler

// Funciones auxiliares
function formatTime(ms) {
  const totalSec = Math.ceil(ms / 1000)
  const min = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60
  const parts = []
  if (min > 0) parts.push(`${min} minuto${min !== 1 ? 's' : ''}`)
  parts.push(`${sec} segundo${sec !== 1 ? 's' : ''}`)
  return parts.join(' ')
}

function getHuntableAnimal(weapon) {
  const animalsByWeapon = {
    bow: [
      { name: 'Conejo', icon: '🐰', difficulty: 1 },
      { name: 'Venado', icon: '🦌', difficulty: 2 },
      { name: 'Jabalí', icon: '🐗', difficulty: 3 }
    ],
    crossbow: [
      { name: 'Lobo', icon: '🐺', difficulty: 4 },
      { name: 'Oso', icon: '🐻', difficulty: 5 },
      { name: 'Tigre', icon: '🐅', difficulty: 6 }
    ],
    rifle: [
      { name: 'Elefante', icon: '🐘', difficulty: 7 },
      { name: 'Rinoceronte', icon: '🦏', difficulty: 8 },
      { name: 'Dragón', icon: '🐉', difficulty: 9 }
    ]
  }
  
  const available = animalsByWeapon[weapon] || animalsByWeapon.bow
  return available[Math.floor(Math.random() * available.length)]
}

function getHuntEvent(animal) {
  const successMessages = [
    `¡Con gran valentía, lograste cazar un ${animal.name}!`,
    `¡Has cazado un ${animal.name}! Tras una persecución electrizante, triunfaste.`,
    `Lograste cazar un ${animal.name} con astucia y persistencia.`,
    `Con gran destreza, atrapaste un ${animal.name}. ¡Una hazaña impresionante!`,
    `Localizaste un ${animal.name} y capturaste con puntería impecable.`
  ]
  
  const failMessages = [
    `El ${animal.name} se escapó justo antes de que dispararas.`,
    `Tu arma falló al intentar cazar el ${animal.name}.`,
    `El ${animal.name} resultó ser más rápido de lo que esperabas.`,
    `Una ráfaga de viento arruinó tu tiro al ${animal.name}.`,
    `El ${animal.name} te sorprendió atacando primero.`
  ]
  
  const successRate = 0.7 - (animal.difficulty * 0.05)
  const isSuccess = Math.random() < successRate
  
  return {
    tipo: isSuccess ? 'victoria' : 'derrota',
    mensaje: isSuccess ? 
      successMessages[Math.floor(Math.random() * successMessages.length)] :
      failMessages[Math.floor(Math.random() * failMessages.length)]
  }
}

function getAnimalLoot(animal) {
  const lootTables = {
    'Conejo': { leather: 1, meat: 2 },
    'Venado': { leather: 2, meat: 3, horn: 1 },
    'Jabalí': { leather: 3, meat: 4, fangs: 2 },
    'Lobo': { leather: 4, meat: 3, fangs: 3 },
    'Oso': { leather: 5, meat: 5, fangs: 4 },
    'Tigre': { leather: 6, meat: 4, fangs: 5 },
    'Elefante': { leather: 10, meat: 8, fangs: 6 },
    'Rinoceronte': { leather: 8, meat: 5, horn: 2 },
    'Dragón': { leather: 15, meat: 10, fangs: 8 }
  }
  
  return lootTables[animal.name] || { leather: 1, meat: 1 }
}