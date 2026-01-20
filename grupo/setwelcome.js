// plugins/setwelcome.js
import { generateWAMessageFromContent } from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, usedPrefix, command, text, participants, groupMetadata }) => {
    const isOwner = [...global.owner.map(v => v.replace(/\D/g, "") + "@s.whatsapp.net")].includes(m.sender)
    const user = global.db.data.users[m.sender]
    const chat = global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {}
    
    // Verificar permisos
    if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos.')
    
    let groupMetadataActual = groupMetadata || await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadataActual) return m.reply('❌ No se pudo obtener información del grupo.')
    
    const participant = groupMetadataActual.participants.find(p => p.id === m.sender)
    if (!participant?.admin && !isOwner) return m.reply('❌ Solo los administradores pueden configurar la bienvenida/despedida.')
    
    // Subcomandos disponibles
    const subcommands = {
        'welcome': {
            name: 'bienvenida',
            desc: 'Configurar mensaje de bienvenida',
            current: chat.sWelcome || '🎉 ¡Bienvenido/a al grupo!'
        },
        'bye': {
            name: 'despedida',
            desc: 'Configurar mensaje de despedida',
            current: chat.sBye || '👋 ¡Hasta luego!'
        },
        'view': {
            name: 'ver',
            desc: 'Ver configuración actual',
            current: null
        },
        'on': {
            name: 'activar',
            desc: 'Activar sistema de bienvenida/despedida',
            current: chat.welcome || false
        },
        'off': {
            name: 'desactivar',
            desc: 'Desactivar sistema',
            current: chat.welcome || false
        },
        'reset': {
            name: 'reiniciar',
            desc: 'Restaurar configuración por defecto',
            current: null
        }
    }
    
    // Si no hay texto, mostrar menú
    if (!text) {
        const welcomeStatus = chat.welcome ? '✅ Activado' : '❌ Desactivado'
        const welcomeMsg = chat.sWelcome ? `📝 Configurada (${chat.sWelcome.length} chars)` : '⚙️ Por defecto'
        const byeMsg = chat.sBye ? `📝 Configurada (${chat.sBye.length} chars)` : '⚙️ Por defecto'
        
        const menuMessage = {
            interactiveMessage: {
                header: {
                    title: '🎉 CONFIGURAR BIENVENIDAS'
                },
                body: {
                    text: `*Estado:* ${welcomeStatus}\n*Bienvenida:* ${welcomeMsg}\n*Despedida:* ${byeMsg}\n\nSelecciona una opción:`
                },
                footer: {
                    text: `${global.botname} • Gestión de Grupo`
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📝 Configurar Bienvenida',
                                id: 'set_welcome'
                            })
                        },
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '👋 Configurar Despedida',
                                id: 'set_bye'
                            })
                        },
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '👁️ Ver Configuración',
                                id: 'view_config'
                            })
                        },
                        {
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📋 Copiar Sintaxis',
                                id: 'copy_syntax',
                                copy_code: getSyntaxGuide()
                            })
                        }
                    ]
                }
            }
        }
        
        await conn.sendMessage(m.chat, menuMessage, { quoted: m })
        return
    }
    
    // Procesar subcomandos
    const args = text.trim().split(' ')
    const subcmd = args[0].toLowerCase()
    const content = args.slice(1).join(' ')
    
    switch (subcmd) {
        case 'welcome':
        case 'bienvenida':
            if (!content) {
                const current = chat.sWelcome || '🎉 ¡Bienvenido/a al grupo!'
                return m.reply(`*Configuración actual de Bienvenida:*\n\n${current}\n\nPara cambiar:\n${usedPrefix}${command} welcome <mensaje>`)
            }
            
            if (content.length > 1000) {
                return m.reply('❌ El mensaje de bienvenida no puede exceder los 1000 caracteres.')
            }
            
            chat.sWelcome = content
            await m.reply(`✅ *Bienvenida configurada correctamente*\n\n📝 Nuevo mensaje:\n${content}`)
            break
            
        case 'bye':
        case 'despedida':
        case 'adios':
            if (!content) {
                const current = chat.sBye || '👋 ¡Hasta luego!'
                return m.reply(`*Configuración actual de Despedida:*\n\n${current}\n\nPara cambiar:\n${usedPrefix}${command} bye <mensaje>`)
            }
            
            if (content.length > 1000) {
                return m.reply('❌ El mensaje de despedida no puede exceder los 1000 caracteres.')
            }
            
            chat.sBye = content
            await m.reply(`✅ *Despedida configurada correctamente*\n\n📝 Nuevo mensaje:\n${content}`)
            break
            
        case 'on':
        case 'activar':
        case 'enable':
            chat.welcome = true
            await m.reply('✅ *Sistema de bienvenida/despedida ACTIVADO*')
            break
            
        case 'off':
        case 'desactivar':
        case 'disable':
            chat.welcome = false
            await m.reply('✅ *Sistema de bienvenida/despedida DESACTIVADO*')
            break
            
        case 'view':
        case 'ver':
        case 'config':
            const status = chat.welcome ? '🟢 ACTIVADO' : '🔴 DESACTIVADO'
            const welcomeMsg = chat.sWelcome || '🎉 ¡Bienvenido/a al grupo!'
            const byeMsg = chat.sBye || '👋 ¡Hasta luego!'
            
            const configMessage = `
*⚙️ CONFIGURACIÓN ACTUAL*

*Estado:* ${status}
*Grupo:* ${groupMetadataActual.subject}

*🎉 MENSAJE DE BIENVENIDA:*
${welcomeMsg}

*👋 MENSAJE DE DESPEDIDA:*
${byeMsg}

*📊 ESTADÍSTICAS:*
• Bienvenida: ${welcomeMsg.length} caracteres
• Despedida: ${byeMsg.length} caracteres

*📌 USO:*
• ${usedPrefix}setwelcome <opción> <mensaje>
• ${usedPrefix}setwelcome on/off
• ${usedPrefix}setwelcome view
            `.trim()
            
            await m.reply(configMessage)
            break
            
        case 'reset':
        case 'reiniciar':
            delete chat.sWelcome
            delete chat.sBye
            chat.welcome = true
            await m.reply('✅ *Configuración restaurada a valores por defecto*')
            break
            
        case 'test':
        case 'probar':
            // Simular una bienvenida para prueba
            const testUser = {
                id: m.sender,
                name: m.pushName || 'Usuario de Prueba'
            }
            
            const welcomeTest = chat.sWelcome || '🎉 ¡Bienvenido/a al grupo!'
            const formattedWelcome = formatMessage(welcomeTest, testUser, groupMetadataActual, 'welcome')
            
            await m.reply(`*🧪 PRUEBA DE BIENVENIDA*\n\n${formattedWelcome}`)
            break
            
        case 'syntax':
        case 'sintaxis':
        case 'help':
            const syntaxGuide = getSyntaxGuide()
            await m.reply(syntaxGuide)
            break
            
        default:
            const helpMessage = `
*🎉 COMANDO SETWELCOME*

*Uso:* ${usedPrefix}setwelcome <opción> [mensaje]

*Opciones disponibles:*
• *welcome <mensaje>* - Configurar mensaje de bienvenida
• *bye <mensaje>* - Configurar mensaje de despedida
• *on/off* - Activar/desactivar sistema
• *view* - Ver configuración actual
• *test* - Probar mensaje de bienvenida
• *reset* - Restaurar valores por defecto
• *syntax* - Ver guía de sintaxis

*Ejemplos:*
• ${usedPrefix}setwelcome welcome ¡Hola @user! Bienvenido a @subject
• ${usedPrefix}setwelcome bye @user ha dejado el grupo
• ${usedPrefix}setwelcome on
• ${usedPrefix}setwelcome view

*📋 Para ver la guía completa de variables:*
${usedPrefix}setwelcome syntax
            `.trim()
            
            await m.reply(helpMessage)
    }
}

// Función para formatear mensajes con variables
function formatMessage(message, user, group, type = 'welcome') {
    const now = new Date()
    const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const date = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    
    const replacements = {
        '@user': user.name || 'Usuario',
        '@number': user.id.split('@')[0] || '',
        '@subject': group.subject || 'Grupo',
        '@desc': group.desc || 'Sin descripción',
        '@owner': group.owner || 'Desconocido',
        '@creation': new Date(group.creation * 1000).toLocaleDateString('es-ES') || 'Desconocida',
        '@time': time,
        '@date': date,
        '@membercount': group.participants?.length || 0,
        '@botname': global.botname,
        '@type': type === 'welcome' ? 'bienvenida' : 'despedida',
        '@mention': `@${user.id.split('@')[0]}`,
        '@groupname': group.subject || 'Grupo'
    }
    
    let formatted = message
    for (const [key, value] of Object.entries(replacements)) {
        formatted = formatted.replace(new RegExp(key, 'gi'), value)
    }
    
    // Procesar condicionales simples
    formatted = formatted.replace(/{if:(.*?):(.*?):(.*?)}/g, (match, condition, ifTrue, ifFalse) => {
        return condition === 'welcome' && type === 'welcome' ? ifTrue : ifFalse
    })
    
    return formatted
}

// Guía completa de sintaxis
function getSyntaxGuide() {
    return `
🎨 *GUÍA DE SINTÁXIS PARA BIENVENIDAS/DESPEDIDAS*

*VARIABLES DISPONIBLES:*
• *@user* → Nombre del usuario
• *@number* → Número del usuario (sin @)
• *@mention* → Mención del usuario (@número)
• *@subject* → Nombre del grupo
• *@groupname* → Nombre del grupo (alias)
• *@desc* → Descripción del grupo
• *@owner* → Dueño del grupo
• *@creation* → Fecha de creación
• *@membercount* → Total de miembros
• *@time* → Hora actual
• *@date* → Fecha actual
• *@botname* → Nombre del bot
• *@type* → Tipo (bienvenida/despedida)

*FORMATO ESPECIAL:*
• *\\n* → Salto de línea
• *\\t* → Tabulación
• *{if:welcome:texto1:texto2}* → Muestra texto1 en bienvenidas, texto2 en despedidas

*EJEMPLOS AVANZADOS:*

1. Bienvenida personalizada:
🎊 *¡BIENVENIDO/A @user!* 🎊
📱 Número: @number
👥 Grupo: @subject
📅 Fecha: @date
⏰ Hora: @time
👤 Miembros: @membercount

2. Despedida con mención:
👋 *@user ha dejado el grupo*
📱 Número: @number
📅 Fecha: @date
⏰ Hora: @time
{@mention} ¡Esperamos verte pronto!

3. Con condicional:
{if:welcome:🎉 ¡BIENVENIDO!:👋 ¡HASTA PRONTO!}
@user al grupo @subject
Miembros actuales: @membercount

*NOTAS:*
• Las variables distinguen entre mayúsculas y minúsculas
• Puedes combinar múltiples variables
• Los mensajes pueden incluir emojis y formato
• Límite: 1000 caracteres por mensaje
    `.trim()
}

// Handler para procesar bienvenidas reales
export async function welcomeHandler(m, conn) {
    const chat = global.db.data.chats[m.chat] || {}
    
    // Verificar si está activado
    if (!chat.welcome) return
    
    // Determinar si es bienvenida o despedida
    const action = m.action
    const participants = m.participants || []
    
    for (const participant of participants) {
        const user = global.db.data.users[participant] || {}
        const userName = user.name || await conn.getName(participant).catch(() => 'Usuario')
        
        let message = ''
        let type = ''
        
        if (action === 'add' || action === 'invite') {
            // Bienvenida
            type = 'welcome'
            message = chat.sWelcome || '🎉 ¡Bienvenido/a al grupo!'
            
            // Intentar obtener foto de perfil
            let profilePic
            try {
                profilePic = await conn.profilePictureUrl(participant, 'image').catch(() => null)
            } catch {
                profilePic = null
            }
            
        } else if (action === 'remove' || action === 'leave') {
            // Despedida
            type = 'bye'
            message = chat.sBye || '👋 ¡Hasta luego!'
        } else {
            continue
        }
        
        // Formatear mensaje
        const groupMetadata = await conn.groupMetadata(m.chat).catch(() => ({ subject: 'Grupo' }))
        const formattedMessage = formatMessage(message, { id: participant, name: userName }, groupMetadata, type)
        
        // Enviar mensaje
        try {
            if (type === 'welcome') {
                // Enviar con imagen si está disponible
                const welcomeMsg = {
                    text: formattedMessage,
                    contextInfo: {
                        mentionedJid: [participant]
                    }
                }
                
                await conn.sendMessage(m.chat, welcomeMsg)
                
            } else {
                // Despedida simple
                await conn.sendMessage(m.chat, { 
                    text: formattedMessage,
                    contextInfo: {
                        mentionedJid: [participant]
                    }
                })
            }
        } catch (error) {
            console.error('Error enviando mensaje de bienvenida/despedida:', error)
        }
    }
}

handler.help = ['setwelcome']
handler.tags = ['group']
handler.command = /^(setwelcome|configwelcome|bienvenida|despedida)$/i
handler.group = true
handler.admin = true
handler.botAdmin = false

export default handler
