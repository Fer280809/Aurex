// plugins/group/welcome-handler.js
let handler = m => m

handler.all = async function (m, { conn }) {
    // Solo procesar en grupos
    if (!m.isGroup) return
    
    try {
        // Obtener datos del chat
        const chatId = m.chat
        const chat = global.db.data.chats[chatId] = global.db.data.chats[chatId] || {}
        
        // Verificar si el sistema de bienvenidas está activado
        if (!chat.welcome) return
        
        // Detectar eventos de grupo usando messageStubType (método más confiable)
        if (m.messageStubType) {
            await handleStubTypeEvent(m, conn, chat, chatId)
        }
        
        // También detectar por texto en algunos casos
        await detectByText(m, conn, chat, chatId)
        
    } catch (error) {
        console.error('Error en welcome-handler:', error)
    }
}

// Manejar eventos por messageStubType
async function handleStubTypeEvent(m, conn, chat, chatId) {
    const stubType = m.messageStubType
    const participants = m.messageStubParameters || []
    
    switch (stubType) {
        case 21: // GROUP_PARTICIPANT_ADD
            for (const participant of participants) {
                if (participant) {
                    await sendWelcome(conn, chatId, participant, chat)
                }
            }
            break
            
        case 22: // GROUP_PARTICIPANT_REMOVE
        case 27: // GROUP_PARTICIPANT_LEAVE
            for (const participant of participants) {
                if (participant) {
                    await sendGoodbye(conn, chatId, participant, chat)
                }
            }
            break
    }
}

// Detectar por texto del sistema
async function detectByText(m, conn, chat, chatId) {
    const text = m.text || ''
    const lowerText = text.toLowerCase()
    
    // Patrones para entradas
    const joinPatterns = [
        /te uniste usando/i,
        /se unió mediante/i,
        /agregó a/i,
        /añadió a/i,
        /added you/i
    ]
    
    // Patrones para salidas
    const leavePatterns = [
        /abandonó el grupo/i,
        /salió del grupo/i,
        /eliminó a/i,
        /fue eliminado/i,
        /left the group/i,
        /removed from/i
    ]
    
    // Buscar menciones en el mensaje
    const mentioned = m.mentionedJid || []
    
    // Verificar si es una entrada
    for (const pattern of joinPatterns) {
        if (pattern.test(lowerText)) {
            for (const user of mentioned) {
                await sendWelcome(conn, chatId, user, chat)
            }
            // Si no hay menciones, usar el remitente
            if (mentioned.length === 0 && m.sender) {
                await sendWelcome(conn, chatId, m.sender, chat)
            }
            return
        }
    }
    
    // Verificar si es una salida
    for (const pattern of leavePatterns) {
        if (pattern.test(lowerText)) {
            for (const user of mentioned) {
                await sendGoodbye(conn, chatId, user, chat)
            }
            // Si no hay menciones, usar el remitente
            if (mentioned.length === 0 && m.sender) {
                await sendGoodbye(conn, chatId, m.sender, chat)
            }
            return
        }
    }
}

// Función para enviar bienvenida
async function sendWelcome(conn, chatId, userId, chat) {
    try {
        // Obtener nombre del usuario
        const userName = await conn.getName(userId).catch(() => 'Usuario')
        
        // Obtener metadatos del grupo
        const groupMetadata = await conn.groupMetadata(chatId).catch(() => ({ 
            subject: 'Grupo',
            participants: [],
            desc: 'Sin descripción'
        }))
        
        // Obtener mensaje personalizado o usar el predeterminado
        const welcomeMessage = chat.sWelcome || '🎉 ¡Bienvenido/a @user al grupo!'
        
        // Formatear el mensaje usando la función de setwelcome
        const formattedMessage = formatWelcomeMessage(welcomeMessage, {
            name: userName,
            id: userId
        }, groupMetadata, 'welcome')
        
        // Enviar mensaje con mención
        await conn.sendMessage(chatId, {
            text: formattedMessage,
            mentions: [userId]
        })
        
        console.log(`✅ Bienvenida enviada a ${userName} (${userId})`)
        
    } catch (error) {
        console.error(`❌ Error en bienvenida para ${userId}:`, error.message)
    }
}

// Función para enviar despedida
async function sendGoodbye(conn, chatId, userId, chat) {
    try {
        // Obtener nombre del usuario
        const userName = await conn.getName(userId).catch(() => 'Usuario')
        
        // Obtener metadatos del grupo
        const groupMetadata = await conn.groupMetadata(chatId).catch(() => ({ 
            subject: 'Grupo',
            participants: [],
            desc: 'Sin descripción'
        }))
        
        // Obtener mensaje personalizado o usar el predeterminado
        const goodbyeMessage = chat.sBye || '👋 ¡Hasta luego @user!'
        
        // Formatear el mensaje
        const formattedMessage = formatWelcomeMessage(goodbyeMessage, {
            name: userName,
            id: userId
        }, groupMetadata, 'bye')
        
        // Enviar mensaje con mención
        await conn.sendMessage(chatId, {
            text: formattedMessage,
            mentions: [userId]
        })
        
        console.log(`✅ Despedida enviada a ${userName} (${userId})`)
        
    } catch (error) {
        console.error(`❌ Error en despedida para ${userId}:`, error.message)
    }
}

// Función para formatear mensajes (compatible con setwelcome.js)
function formatWelcomeMessage(message, user, group, type = 'welcome') {
    const now = new Date()
    const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const date = now.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })
    
    const replacements = {
        '@user': user.name || 'Usuario',
        '@number': user.id.split('@')[0] || '',
        '@mention': `@${user.id.split('@')[0]}`,
        '@subject': group.subject || 'Grupo',
        '@groupname': group.subject || 'Grupo',
        '@desc': group.desc || 'Sin descripción',
        '@owner': 'Administrador',
        '@creation': 'Reciente',
        '@time': time,
        '@date': date,
        '@membercount': group.participants?.length || 0,
        '@botname': global.botname || 'Asta Bot',
        '@type': type === 'welcome' ? 'bienvenida' : 'despedida'
    }
    
    let formatted = message
    for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        formatted = formatted.replace(regex, value)
    }
    
    return formatted
}

// Exportar funciones para uso externo
export {
    sendWelcome,
    sendGoodbye,
    formatWelcomeMessage
}

export default handler
