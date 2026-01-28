import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

class EventManager {
  constructor() {
    this.events = new Map()
    this.activeEvents = new Map()
    this.loadEvents()
  }

  loadEvents() {
    const eventsPath = join(__dirname, 'events.json')
    if (existsSync(eventsPath)) {
      try {
        const data = JSON.parse(readFileSync(eventsPath, 'utf-8'))
        this.events = new Map(Object.entries(data))
        
        for (const [id, event] of this.events) {
          if (event.status === 'waiting' || event.status === 'active') {
            this.activeEvents.set(event.chatId, id)
          }
        }
      } catch (error) {
        console.error('Error loading events:', error)
      }
    }
  }

  saveEvents() {
    const eventsPath = join(__dirname, 'events.json')
    const data = Object.fromEntries(this.events)
    writeFileSync(eventsPath, JSON.stringify(data, null, 2), 'utf-8')
  }

  createEvent(chatId, duration, participantsCount) {
    const eventId = `${chatId}_${Date.now()}`
    
    const event = {
      id: eventId,
      chatId,
      duration,
      startTime: Date.now(),
      endTime: Date.now() + (duration * 60 * 60 * 1000),
      maxParticipants: participantsCount,
      participants: [],
      status: 'waiting',
      messageId: null,
      messageKey: null,
      minigame: null,
      leaderboard: [],
      gameType: 'freefire'
    }

    this.events.set(eventId, event)
    this.activeEvents.set(chatId, eventId)
    this.saveEvents()
    
    return event
  }

  async updateEventMessage(event, conn) {
    if (!event.messageId || !event.messageKey) return false
    
    try {
      const realParticipants = event.participants.filter(p => !p.userId.startsWith('empty_'))
      const remainingSlots = Math.max(0, event.maxParticipants - realParticipants.length)
      
      // Construir mensaje actualizado
      let message = `🎮 *EVENTO FREE FIRE* 🎮\n\n`
      message += `⏰ Duración: *${event.duration} hora${event.duration > 1 ? 's' : ''}*\n`
      message += `👥 Cupos: *${event.maxParticipants} jugadores*\n`
      message += `📅 Inicia: ${new Date(event.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}\n\n`
      message += `📋 *LISTA DE PARTICIPANTES:*\n`

      // Mostrar participantes registrados
      realParticipants.forEach(p => {
        const shortName = p.userName.length > 15 
          ? p.userName.substring(0, 12) + '...' 
          : p.userName
        message += `\n${p.position}. @${p.userId.split('@')[0]} (${shortName})`
      })

      // Mostrar slots vacíos
      for (let i = 1; i <= remainingSlots; i++) {
        message += `\n${realParticipants.length + i}. ━━━`
      }

      const remainingTime = Math.max(0, event.endTime - Date.now())
      const hours = Math.floor(remainingTime / (1000 * 60 * 60))
      const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60))
      
      message += `\n\n✅ *${realParticipants.length}/${event.maxParticipants} participantes*`
      message += `\n🕒 *Tiempo restante: ${hours}h ${minutes}m*`
      message += `\n\n🔥 *Reacciona con 🎮 para unirte*`
      message += `\n⚠️ *Se completará automáticamente en 5 minutos si no se llena*`

      // Editar el mensaje original
      await conn.relayMessage(event.chatId, {
        protocolMessage: {
          key: event.messageKey,
          type: 14, // 14 = REVOKE
          editedMessage: {
            conversation: message
          }
        }
      }).catch(async (error) => {
        // Fallback: intentar otro método de edición
        try {
          await conn.sendMessage(event.chatId, {
            text: message,
            edit: event.messageId,
            mentions: realParticipants.map(p => p.userId)
          })
        } catch (e2) {
          console.error('Error editing message:', e2)
        }
      })
      
      return true
    } catch (error) {
      console.error('Error updating event message:', error)
      return false
    }
  }

  async addParticipant(eventId, userId, userName, conn) {
    const event = this.events.get(eventId)
    if (!event) return { success: false, reason: 'Evento no encontrado' }
    
    if (Date.now() > event.endTime) {
      return { success: false, reason: 'El evento ya terminó' }
    }
    
    const realParticipants = event.participants.filter(p => !p.userId.startsWith('empty_'))
    
    if (realParticipants.length >= event.maxParticipants) {
      return { success: false, reason: 'El evento ya está lleno' }
    }
    
    if (realParticipants.some(p => p.userId === userId)) {
      return { success: false, reason: 'Ya estás registrado' }
    }
    
    // Agregar participante
    event.participants.push({
      userId,
      userName,
      joinTime: Date.now(),
      position: realParticipants.length + 1
    })
    
    this.events.set(eventId, event)
    this.saveEvents()
    
    // Actualizar mensaje
    await this.updateEventMessage(event, conn)
    
    return { 
      success: true, 
      position: realParticipants.length + 1,
      currentCount: realParticipants.length + 1,
      maxCount: event.maxParticipants
    }
  }

  async autoCompleteEvent(eventId, conn) {
    const event = this.events.get(eventId)
    if (!event) return false
    
    const realParticipants = event.participants.filter(p => !p.userId.startsWith('empty_'))
    const remainingSlots = event.maxParticipants - realParticipants.length
    
    // Completar con participantes vacíos
    for (let i = 0; i < remainingSlots; i++) {
      event.participants.push({
        userId: `empty_${Date.now()}_${i}`,
        userName: 'Vacío',
        joinTime: Date.now(),
        position: realParticipants.length + i + 1
      })
    }
    
    this.events.set(eventId, event)
    this.saveEvents()
    
    // Actualizar mensaje final
    await this.updateEventMessage(event, conn)
    
    return true
  }

  startMinigame(eventId, minigameData) {
    const event = this.events.get(eventId)
    if (!event) return false
    
    event.status = 'active'
    event.minigame = {
      ...minigameData,
      startTime: Date.now(),
      endTime: Date.now() + 10000, // 10 segundos
      responses: [],
      correctAnswer: null
    }
    
    this.events.set(eventId, event)
    this.saveEvents()
    
    return true
  }

  addMinigameResponse(eventId, userId, userName, answer, isCorrect, responseTime) {
    const event = this.events.get(eventId)
    if (!event || !event.minigame) return false
    
    // Verificar si ya respondió
    if (event.minigame.responses.some(r => r.userId === userId)) return false
    
    // Verificar si aún está en tiempo
    if (Date.now() > event.minigame.endTime) return false
    
    event.minigame.responses.push({
      userId,
      userName,
      answer,
      isCorrect,
      responseTime,
      timestamp: Date.now()
    })
    
    // Ordenar por tiempo (más rápido primero) y luego por correcto
    event.minigame.responses.sort((a, b) => {
      if (a.isCorrect && !b.isCorrect) return -1
      if (!a.isCorrect && b.isCorrect) return 1
      return a.responseTime - b.responseTime
    })
    
    this.events.set(eventId, event)
    this.saveEvents()
    
    return true
  }

  getEventByChat(chatId) {
    const eventId = this.activeEvents.get(chatId)
    if (!eventId) return null
    return this.events.get(eventId)
  }

  setMessageInfo(eventId, messageId, messageKey) {
    const event = this.events.get(eventId)
    if (!event) return false
    
    event.messageId = messageId
    event.messageKey = messageKey
    this.events.set(eventId, event)
    this.saveEvents()
    
    return true
  }

  formatTime(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }
}

export const eventManager = new EventManager()