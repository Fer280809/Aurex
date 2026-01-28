import { eventManager } from './eventManager.js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Cargar datos FF
let ffData = []
try {
  const dataPath = join(__dirname, 'ffdata.json')
  ffData = JSON.parse(readFileSync(dataPath, 'utf-8')).skins
} catch (error) {
  console.error('Error loading FF data:', error)
  ffData = []
}

const handler = async (m, { conn }) => {
  try {
    if (!m.isGroup) return
    
    const event = eventManager.getEventByChat(m.chat)
    if (!event || event.status !== 'waiting') return
    
    // Cambiar estado
    event.status = 'active'
    
    // Seleccionar pregunta aleatoria
    const randomIndex = Math.floor(Math.random() * ffData.length)
    const question = { ...ffData[randomIndex] }
    
    // Mezclar respuestas
    const answers = [...question.respuestas].sort(() => Math.random() - 0.5)
    const correctIndex = answers.findIndex(a => a === question.titulo)
    
    // Guardar minijuego
    eventManager.startMinigame(event.id, {
      question: `¿Cómo se llama este ${question.tipo === 'personaje' ? 'personaje' : 'arma'} de Free Fire?`,
      answers,
      correctAnswer: question.titulo,
      image: question.image
    })
    
    // Enviar pregunta
    const questionMsg = `🎮 *MINIJUEGO FREE FIRE* 🎮\n\n` +
      `⏰ *TIEMPO: 10 SEGUNDOS*\n\n` +
      `❓ ${event.minigame.question}\n\n` +
      `🔥 *Selecciona la respuesta correcta:*`
    
    const buttons = answers.map((answer, idx) => ({
      buttonId: `ffanswer_${event.id}_${idx}_${answer === question.titulo ? 'correct' : 'wrong'}`,
      buttonText: { displayText: `${String.fromCharCode(65 + idx)}. ${answer}` }
    }))
    
    await conn.sendMessage(m.chat, {
      image: { url: question.image },
      caption: questionMsg,
      footer: '⚡ ¡Responde rápido!',
      buttons,
      headerType: 4
    })
    
    // Temporizador de 10 segundos
    setTimeout(async () => {
      const currentEvent = eventManager.getEventByChat(m.chat)
      if (!currentEvent || !currentEvent.minigame) return
      
      // Obtener respuestas correctas
      const correctResponses = currentEvent.minigame.responses
        .filter(r => r.isCorrect)
        .sort((a, b) => a.responseTime - b.responseTime)
        .slice(0, 10)
      
      // Construir mensaje de resultados
      let resultsMsg = `🏆 *RESULTADOS DEL MINIJUEGO* 🏆\n\n` +
        `🎯 *Pregunta:* ${currentEvent.minigame.question}\n` +
        `✅ *Respuesta correcta:* ${currentEvent.minigame.correctAnswer}\n\n`
      
      if (correctResponses.length > 0) {
        resultsMsg += `📊 *TOP ${Math.min(10, correctResponses.length)} GANADORES:*\n\n`
        
        correctResponses.forEach((resp, index) => {
          const time = (resp.responseTime / 1000).toFixed(2)
          resultsMsg += `${index + 1}. 🥇 @${resp.userId.split('@')[0]} - ${time}s\n`
        })
        
        resultsMsg += `\n🎉 *¡Felicidades a los ganadores!*`
      } else {
        resultsMsg += `😔 *Nadie respondió correctamente*\n` +
          `💡 Mejor suerte la próxima vez`
      }
      
      resultsMsg += `\n\n🎮 *EVENTO FREE FIRE FINALIZADO* 🎮`
      
      // Enviar resultados
      await conn.sendMessage(m.chat, {
        text: resultsMsg,
        mentions: correctResponses.map(r => r.userId)
      })
      
      // Marcar evento como completado
      eventManager.completeEvent(currentEvent.id)
      
    }, 10000) // 10 segundos
    
  } catch (error) {
    console.error('Error en eventoff:', error)
  }
}

// Manejar respuestas a botones
handler.before = async (m, { conn }) => {
  if (!m.buttonId || !m.buttonId.startsWith('ffanswer_')) return
  
  try {
    const parts = m.buttonId.split('_')
    if (parts.length !== 4) return
    
    const eventId = parts[1]
    const answerIndex = parseInt(parts[2])
    const isCorrect = parts[3] === 'correct'
    
    const event = eventManager.events.get(eventId)
    if (!event || !event.minigame) return
    
    // Calcular tiempo de respuesta
    const responseTime = Date.now() - event.minigame.startTime
    
    // Solo aceptar si está dentro de los 10 segundos
    if (responseTime > 10000) {
      await m.react('⏰')
      return
    }
    
    // Obtener nombre
    const userName = m.pushName || await conn.getName(m.sender).catch(() => 'Jugador')
    
    // Registrar respuesta
    const registered = eventManager.addMinigameResponse(
      eventId,
      m.sender,
      userName,
      event.minigame.answers[answerIndex],
      isCorrect,
      responseTime
    )
    
    if (registered) {
      await m.react(isCorrect ? '✅' : '❌')
      
      if (isCorrect) {
        // Notificación rápida
        const timeStr = (responseTime / 1000).toFixed(2)
        await conn.sendMessage(m.chat, {
          text: `🎯 @${m.sender.split('@')[0]} ¡Correcto en ${timeStr}s!`,
          mentions: [m.sender]
        }, { quoted: m })
      }
    }
  } catch (error) {
    console.error('Error handling button:', error)
  }
}

handler.help = ['eventoff (automático)']
handler.tags = ['eventos']
handler.command = ['eventoff']
handler.group = true

export default handler