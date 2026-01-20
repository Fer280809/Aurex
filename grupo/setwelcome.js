// plugins/group/setwelcome.js
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
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📝 Configurar Bienvenida',
                                id: 'set_welcome',
                                copy_code: `${usedPrefix}${command} welcome `
                            })
                        },
                        {
                            name: 'cta_copy', 
                            buttonParamsJson: JSON.stringify({
                                display_text: '👋 Configurar Despedida',
                                id: 'set_bye',
                                copy_code: `${usedPrefix}${command} bye `
                            })
                        },
                        {
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📋 Sintaxis Disponible',
                                id: 'show_syntax',
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
                return m.reply(`*Configuración actual de Bienvenida:*\n\n${current}\n\nPara cambiar:\n${usedPrefix}${command} welcome <mensaje>\n\nEjemplo:\n${usedPrefix}${command} welcome ¡Hola @user! Bienvenido a @subject`)
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
        '@owner': 'Administrador',
        '@creation': 'Hoy',
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
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        formatted = formatted.replace(regex, value)
    }
    
    return formatted
}

// Guía completa de sintaxis
function getSyntaxGuide() {
    return `
🎨 *VARIABLES DISPONIBLES PARA BIENVENIDAS/DESPEDIDAS:*

*Información del usuario:*
• @user → Nombre del usuario
• @number → Número del usuario
• @mention → Mención (@número)

*Información del grupo:*
• @subject → Nombre del grupo
• @groupname → Nombre del grupo
• @desc → Descripción del grupo
• @membercount → Total de miembros

*Fecha y hora:*
• @time → Hora actual (HH:MM)
• @date → Fecha actual

*Otros:*
• @botname → Nombre del bot
• @type → "bienvenida" o "despedida"

*EJEMPLOS:*
¡Hola @user! Bienvenido a @subject 👋
@mention se unió al grupo @groupname 🎉
@user ha salido de @subject 👋
Bienvenido @user! Somos @membercount miembros 🤝
    `.trim()
}

// Exportar funciones para el handler de eventos
export const welcomeFunctions = {
    formatMessage,
    getSyntaxGuide
}

handler.help = ['setwelcome']
handler.tags = ['group']
handler.command = /^(setwelcome|configwelcome|bienvenida|despedida)$/i
handler.group = true
handler.admin = true
handler.botAdmin = false

export default handler
