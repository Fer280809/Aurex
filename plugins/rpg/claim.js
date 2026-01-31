// commands/claim2.js
import { claimMission, claimChest, getMissionStats } from '../lib/daily-missions.js'

let handler = async (m, { conn, usedPrefix }) => {
  let user = global.db.data.users[m.sender]
  const args = m.text.split(' ')
  
  if (args.length < 2) {
    // Mostrar ayuda
    let text = `🎁 *SISTEMA DE RECOMPENSAS*\n\n`
    text += `📋 *Uso:*\n`
    text += `• *${usedPrefix}claim2 [id_mission]* - Reclamar misión específica\n`
    text += `• *${usedPrefix}claim2 chest* - Reclamar cofre especial\n`
    text += `• *${usedPrefix}claim2 all* - Reclamar todas las misiones completadas\n\n`
    text += `📊 *Misiones disponibles:*\n`
    
    user.dailyMissions.list.forEach(ms => {
      if (ms.progress >= ms.target && !ms.claimed) {
        text += `• ${ms.emoji} *${ms.id}* - ${ms.name}\n`
      }
    })
    
    if (user.dailyMissions.chestUnlocked && !user.dailyMissions.chestClaimed) {
      text += `\n🎁 *Cofre especial disponible!* Usa: *${usedPrefix}claim2 chest*\n`
    }
    
    return conn.reply(m.chat, text.trim(), m)
  }
  
  const action = args[1].toLowerCase()
  
  if (action === 'chest') {
    const result = claimChest(user)
    if (!result.ok) {
      return conn.reply(m.chat, result.msg, m)
    }
    
    let text = `🎉 *¡COFRE ESPECIAL RECLAMADO!*\n\n`
    text += `💰 Monedas: ¥${result.coins.toLocaleString()}\n`
    text += `❤️ Corazones: ${result.hearts}\n`
    text += `⭐ EXP: ${result.exp || 0}\n`
    text += `🔥 Racha: ${result.streak} días consecutivos\n\n`
    text += `¡Sigue así para mejores recompensas!`
    
    return conn.reply(m.chat, text.trim(), m)
  }
  
  if (action === 'all') {
    let totalCoins = 0
    let totalHearts = 0
    let claimedCount = 0
    
    for (const mission of user.dailyMissions.list) {
      if (mission.progress >= mission.target && !mission.claimed) {
        const result = claimMission(user, mission.id)
        if (result.ok) {
          totalCoins += result.coins
          totalHearts += result.hearts
          claimedCount++
        }
      }
    }
    
    if (claimedCount === 0) {
      return conn.reply(m.chat, '❌ No hay misiones completadas para reclamar', m)
    }
    
    let text = `🎉 *¡RECOMPENSAS RECLAMADAS!*\n\n`
    text += `📦 Misiones reclamadas: ${claimedCount}\n`
    text += `💰 Total monedas: ¥${totalCoins.toLocaleString()}\n`
    text += `❤️ Total corazones: ${totalHearts}\n\n`
    
    if (user.dailyMissions.chestUnlocked && !user.dailyMissions.chestClaimed) {
      text += `🎁 *¡Cofre especial desbloqueado!* Usa: *${usedPrefix}claim2 chest*\n`
    }
    
    return conn.reply(m.chat, text.trim(), m)
  }
  
  // Reclamar misión específica
  const result = claimMission(user, action)
  if (!result.ok) {
    return conn.reply(m.chat, result.msg, m)
  }
  
  let text = `🎉 *¡MISIÓN COMPLETADA!*\n\n`
  text += `🏆 Misión: ${result.name}\n`
  text += `💰 Monedas: ¥${result.coins.toLocaleString()}\n`
  text += `❤️ Corazones: ${result.hearts}\n`
  text += `🔥 Racha actual: ${result.streak} días\n\n`
  
  if (result.allClaimed) {
    text += `🎊 *¡TODAS LAS MISIONES COMPLETADAS!*\n`
    text += `🎁 Usa *${usedPrefix}claim2 chest* para reclamar el cofre especial\n`
  } else {
    const stats = getMissionStats(user)
    text += `📊 Progreso: ${stats.claimed}/${stats.total} misiones reclamadas\n`
  }
  
  conn.reply(m.chat, text.trim(), m)
}

// CAMBIA ESTA LÍNEA PARA USAR claim2:
handler.command = ['claim2', 'reclamar2', 'reclamo2']
handler.tags = ['rpg']
handler.help = ['claim2 [id] - Reclamar recompensa de misión (versión 2)']

export default handler