import { eventManager } from './eventManager.js'

const handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    if (!m.isGroup) {
      return conn.reply(m.chat, '❌ Este comando solo funciona en grupos.', m)
    }

    if (!args[0]) {
      return conn.reply(m.chat, 
        `🎮 *EVENTO FREE FIRE* 🎮\n\n` +
        `📌 *Uso:* ${usedPrefix}eventstart <horas> <jugadores>\n\n` +
        `📝 *Ejemplos:*\n` +
        `• ${usedPrefix}eventstart 4 30\n` +
        `• ${usedPrefix}eventstart 2 40\n\n` +
        `⚡ *Mínimo:* 1 hora, 10 jugadores\n` +
        `⚡ *Máximo:* 12 horas, 50 jugadores`,
        m
      )
    }

    const horas = parseInt(args[0])
    const jugadores = parseInt(args[1]) || 30

    if (isNaN(horas) || horas < 1 || horas > 12) {
      return conn.reply(m.chat, '❌ Horas deben ser entre 1 y 12.', m)
    }

    if (isNaN(jugadores) || jugadores < 10 || jugadores > 50) {
      return conn.reply(m.chat, '❌ Jugadores deben ser entre 10 y 50.', m)
    }

    // Verificar evento existente
    const existingEvent = eventManager.getEventByChat(m.chat)
    if (existingEvent) {
      const remaining = existingEvent.endTime - Date.now()
      const timeStr = eventManager.formatTime(remaining)
      return conn.reply(m.chat, 
        `⚠️ *Ya hay un evento activo*\n\n` +
        `⏰ Tiempo restante: ${timeStr}\n` +
        `👥 Participantes: ${existingEvent.participants.filter(p => !p.userId.startsWith('empty_')).length}/${existingEvent.maxParticipants}`,
        m
      )
    }

    // Crear evento
    const event = eventManager.createEvent(m.chat, horas, jugadores)

    // Crear mensaje inicial
    let message = `🎮 *EVENTO FREE FIRE* 🎮\n\n`
    message += `⏰ Duración: *${horas} hora${horas > 1 ? 's' : ''}*\n`
    message += `👥 Cupos: *${jugadores} jugadores*\n`
    message += `📅 Inicia: ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}\n\n`
    message += `📋 *LISTA DE PARTICIPANTES:*\n`

    // Agregar lista vacía
    for (let i = 1; i <= jugadores; i++) {
      message += `\n${i}. ━━━`
    }

    message += `\n\n✅ *0/${jugadores} participantes*`
    message += `\n🕒 *Tiempo restante: ${horas}h 0m*`
    message += `\n\n🔥 *Reacciona con 🎮 para unirte*`
    message += `\n⚠️ *Se completará en 5 minutos si no se llena*`

    // Enviar mensaje
    const sentMsg = await conn.sendMessage(m.chat, { text: message })
    
    // Guardar información del mensaje
    eventManager.setMessageInfo(event.id, sentMsg.key.id, sentMsg.key)

    // Agregar reacción inicial
    await conn.sendMessage(m.chat, {
      react: { text: '🎮', key: sentMsg.key }
    })

    // Configurar verificación cada 30 segundos
    const checkInterval = setInterval(async () => {
      const currentEvent = eventManager.getEventByChat(m.chat)
      if (!currentEvent || currentEvent.status !== 'waiting') {
        clearInterval(checkInterval)
        return
      }

      // Verificar si ya pasaron 5 minutos
      const fiveMinutesPassed = Date.now() - currentEvent.startTime > 5 * 60 * 1000
      const realParticipants = currentEvent.participants.filter(p => !p.userId.startsWith('empty_'))
      
      if (fiveMinutesPassed && realParticipants.length > 0) {
        clearInterval(checkInterval)
        
        // Auto-completar si no está lleno
        if (realParticipants.length < currentEvent.maxParticipants) {
          await eventManager.autoCompleteEvent(currentEvent.id, conn)
        }
        
        // Iniciar minijuego después de 3 segundos
        setTimeout(() => {
          global.events.emit('startMinigame', currentEvent.id)
        }, 3000)
      }
      
      // Verificar si el tiempo terminó
      if (Date.now() > currentEvent.endTime) {
        clearInterval(checkInterval)
        
        // Auto-completar si no está lleno
        if (realParticipants.length < currentEvent.maxParticipants) {
          await eventManager.autoCompleteEvent(currentEvent.id, conn)
        }
        
        // Iniciar minijuego
        setTimeout(() => {
          global.events.emit('startMinigame', currentEvent.id)
        }, 3000)
      }
      
      // Verificar si ya se llenó
      if (realParticipants.length >= currentEvent.maxParticipants) {
        clearInterval(checkInterval)
        
        // Iniciar minijuego después de 5 segundos
        setTimeout(() => {
          global.events.emit('startMinigame', currentEvent.id)
        }, 5000)
      }
    }, 30000) // Verificar cada 30 segundos

    await m.react('✅')

  } catch (error) {
    console.error('Error en eventstart:', error)
    await m.react('❌')
    conn.reply(m.chat, '❌ Error al iniciar el evento.', m)
  }
}

// Sistema de escucha de reacciones
let reactionHandler = null

export function setupReactionHandler(conn) {
  if (reactionHandler) return
  
  reactionHandler = async (m) => {
    try {
      if (!m.reaction || !m.isGroup) return
      
      // Solo procesar reacción 🎮
      if (m.reaction.text !== '🎮') return
      
      const event = eventManager.getEventByChat(m.chat)
      if (!event || event.status !== 'waiting') return
      
      // Verificar que la reacción sea al mensaje del evento
      if (m.key.id !== event.messageId) return
      
      const userId = m.sender
      const userName = m.pushName || await conn.getName(userId).catch(() => 'Jugador')
      
      // Agregar participante
      const result = await eventManager.addParticipant(event.id, userId, userName, conn)
      
      if (result.success) {
        // Notificación rápida
        await conn.sendMessage(m.chat, {
          text: `✅ @${userId.split('@')[0]} se unió (posición ${result.position})`,
          mentions: [userId]
        }, { quoted: m })
      } else {
        // Mensaje de error
        if (result.reason === 'Ya estás registrado') {
          await conn.sendMessage(m.chat, {
            text: `⚠️ @${userId.split('@')[0]} ya estás registrado.`,
            mentions: [userId]
          }, { quoted: m })
        }
      }
    } catch (error) {
      console.error('Error en reaction handler:', error)
    }
  }
  
  // Registrar el handler globalmente
  if (global.conn) {
    global.conn.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (msg.reaction) {
          await reactionHandler(msg)
        }
      }
    })
  }
}

handler.help = ['eventstart <horas> <jugadores>']
handler.tags = ['eventos']
handler.command = ['eventstart', 'eventofff']
handler.group = true
handler.admin = true

// Inicializar el handler de reacciones cuando se carga el plugin
handler.init = async (conn) => {
  setupReactionHandler(conn)
}

export default handler