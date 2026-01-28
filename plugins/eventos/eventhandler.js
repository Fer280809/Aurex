import { eventManager } from './eventManager.js'
import eventoffHandler from './eventoff.js'

// Configurar sistema de eventos global
global.eventSystem = {
  timers: new Map(),
  
  startEventTimer: (eventId, durationMs) => {
    const timer = setTimeout(() => {
      this.triggerMinigame(eventId)
    }, durationMs)
    
    this.timers.set(eventId, timer)
  },
  
  triggerMinigame: async (eventId) => {
    const event = eventManager.events.get(eventId)
    if (!event) return
    
    // Auto-completar si es necesario
    const realParticipants = event.participants.filter(p => !p.userId.startsWith('empty_'))
    if (realParticipants.length < event.maxParticipants) {
      await eventManager.autoCompleteEvent(eventId, global.conn)
    }
    
    // Esperar 3 segundos y ejecutar minijuego
    setTimeout(async () => {
      if (global.conn) {
        await eventoffHandler({ 
          chat: event.chatId,
          isGroup: true,
          from: event.chatId
        }, { conn: global.conn })
      }
    }, 3000)
  },
  
  cleanup: () => {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
  }
}

// Restaurar timers al iniciar
if (global.conn) {
  setTimeout(() => {
    for (const [id, event] of eventManager.events) {
      if (event.status === 'waiting') {
        const remaining = event.endTime - Date.now()
        if (remaining > 0) {
          global.eventSystem.startEventTimer(id, remaining)
        } else {
          // Tiempo terminado, iniciar minigame
          global.eventSystem.triggerMinigame(id)
        }
      }
    }
  }, 5000)
}

export { eventManager }