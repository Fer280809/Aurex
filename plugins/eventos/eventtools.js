import { eventManager } from './eventManager.js'

const handler = async (m, { conn, args, usedPrefix }) => {
  if (!m.isGroup) return
  
  const subcmd = args[0]?.toLowerCase()
  
  switch(subcmd) {
    case 'info':
      const event = eventManager.getEventByChat(m.chat)
      if (!event) {
        return conn.reply(m.chat, '❌ No hay evento activo.', m)
      }
      
      const realParts = event.participants.filter(p => !p.userId.startsWith('empty_'))
      const timeLeft = eventManager.formatTime(event.endTime - Date.now())
      
      let info = `🎮 *INFORMACIÓN DEL EVENTO* 🎮\n\n` +
        `🆔 ID: ${event.id.slice(-8)}\n` +
        `⏰ Duración: ${event.duration}h\n` +
        `👥 Participantes: ${realParts.length}/${event.maxParticipants}\n` +
        `🕒 Tiempo restante: ${timeLeft}\n` +
        `📊 Estado: ${event.status === 'waiting' ? 'Inscripciones' : 'Activo'}\n\n` +
        `🎯 *Últimos participantes:*\n`
      
      realParts.slice(-5).forEach(p => {
        info += `• @${p.userId.split('@')[0]}\n`
      })
      
      await conn.reply(m.chat, info, m)
      break
      
    case 'list':
      const activeEvents = Array.from(eventManager.events.values())
        .filter(e => e.status === 'waiting')
        .slice(0, 5)
      
      if (activeEvents.length === 0) {
        return conn.reply(m.chat, '📭 No hay eventos activos.', m)
      }
      
      let list = `📋 *EVENTOS ACTIVOS* (${activeEvents.length})\n\n`
      
      activeEvents.forEach(e => {
        const parts = e.participants.filter(p => !p.userId.startsWith('empty_')).length
        list += `• Grupo: ${e.chatId.slice(0, 10)}...\n` +
          `  👥 ${parts}/${e.maxParticipants}\n` +
          `  ⏰ ${e.duration}h restantes\n\n`
      })
      
      await conn.reply(m.chat, list, m)
      break
      
    case 'cancel':
      if (!m.isAdmin) {
        return conn.reply(m.chat, '❌ Solo administradores.', m)
      }
      
      const currentEvent = eventManager.getEventByChat(m.chat)
      if (!currentEvent) {
        return conn.reply(m.chat, '❌ No hay evento para cancelar.', m)
      }
      
      eventManager.completeEvent(currentEvent.id)
      await conn.reply(m.chat, '✅ Evento cancelado.', m)
      break
      
    default:
      await conn.reply(m.chat,
        `🛠️ *HERRAMIENTAS DE EVENTOS*\n\n` +
        `📌 Comandos:\n` +
        `• ${usedPrefix}eventtools info → Información del evento\n` +
        `• ${usedPrefix}eventtools list → Listar eventos activos\n` +
        `• ${usedPrefix}eventtools cancel → Cancelar evento (admin)\n\n` +
        `🎮 Para crear: ${usedPrefix}eventstart <horas> <jugadores>`,
        m
      )
  }
}

handler.help = ['eventtools <comando>']
handler.tags = ['eventos']
handler.command = ['eventtools', 'etools']
handler.group = true

export default handler