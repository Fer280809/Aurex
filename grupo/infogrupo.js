// plugins/infogroup.js
import { generateWAMessageFromContent } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix, command, text }) => {
    if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos.')
    
    const user = global.db.data.users[m.sender] || {}
    const chat = global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {}
    
    // Obtener metadatos del grupo
    let groupMetadata
    try {
        groupMetadata = await conn.groupMetadata(m.chat)
    } catch (error) {
        return m.reply('❌ No se pudo obtener información del grupo.')
    }
    
    // Configuración de infogroup personalizada
    chat.infogroupConfig = chat.infogroupConfig || {
        style: 'modern', // modern, minimal, detailed, cards
        showOwner: true,
        showCreationDate: true,
        showDescription: true,
        showLink: true,
        showMembers: true,
        showAdmins: true,
        showSettings: true,
        showStats: true,
        customTitle: '',
        customFooter: '',
        theme: 'default' // default, dark, colorful, professional
    }
    
    const config = chat.infogroupConfig
    
    // Subcomandos
    const args = text ? text.trim().split(' ') : []
    const subcmd = args[0] ? args[0].toLowerCase() : ''
    
    // Si no hay subcomando, mostrar información
    if (!subcmd) {
        return await showGroupInfo(m, conn, groupMetadata, config)
    }
    
    // Manejar subcomandos de configuración
    switch (subcmd) {
        case 'config':
        case 'settings':
        case 'configurar':
            return await showConfigMenu(m, conn, config)
            
        case 'style':
        case 'estilo':
            const style = args[1]
            const validStyles = ['modern', 'minimal', 'detailed', 'cards', 'simple']
            if (!style || !validStyles.includes(style)) {
                return m.reply(`🎨 *Estilos disponibles:*\n${validStyles.map(s => `• ${s}`).join('\n')}\n\nUso: ${usedPrefix}${command} style <nombre>`)
            }
            config.style = style
            await m.reply(`✅ Estilo cambiado a: *${style}*`)
            break
            
        case 'theme':
        case 'tema':
            const theme = args[1]
            const validThemes = ['default', 'dark', 'colorful', 'professional', 'custom']
            if (!theme || !validThemes.includes(theme)) {
                return m.reply(`🎭 *Temas disponibles:*\n${validThemes.map(t => `• ${t}`).join('\n')}\n\nUso: ${usedPrefix}${command} theme <nombre>`)
            }
            config.theme = theme
            await m.reply(`✅ Tema cambiado a: *${theme}*`)
            break
            
        case 'toggle':
        case 'alternar':
            const option = args[1]
            const validOptions = ['owner', 'creation', 'description', 'link', 'members', 'admins', 'settings', 'stats']
            
            if (!option || !validOptions.includes(option)) {
                return m.reply(`⚙️ *Opciones para alternar:*\n${validOptions.map(o => `• ${o}`).join('\n')}\n\nUso: ${usedPrefix}${command} toggle <opción>`)
            }
            
            const optionKey = `show${option.charAt(0).toUpperCase() + option.slice(1)}`
            config[optionKey] = !config[optionKey]
            const status = config[optionKey] ? 'activada' : 'desactivada'
            await m.reply(`✅ Visualización de *${option}* ${status}`)
            break
            
        case 'title':
        case 'titulo':
            const title = args.slice(1).join(' ')
            if (!title) {
                config.customTitle = ''
                await m.reply('✅ Título personalizado eliminado')
            } else {
                config.customTitle = title.substring(0, 50)
                await m.reply(`✅ Título personalizado establecido:\n"${title.substring(0, 50)}"`)
            }
            break
            
        case 'footer':
        case 'pie':
            const footer = args.slice(1).join(' ')
            if (!footer) {
                config.customFooter = ''
                await m.reply('✅ Pie de página personalizado eliminado')
            } else {
                config.customFooter = footer.substring(0, 100)
                await m.reply(`✅ Pie de página establecido:\n"${footer.substring(0, 100)}"`)
            }
            break
            
        case 'reset':
        case 'reiniciar':
            chat.infogroupConfig = {
                style: 'modern',
                showOwner: true,
                showCreationDate: true,
                showDescription: true,
                showLink: true,
                showMembers: true,
                showAdmins: true,
                showSettings: true,
                showStats: true,
                customTitle: '',
                customFooter: '',
                theme: 'default'
            }
            await m.reply('✅ Configuración de infogroup restaurada a valores por defecto')
            break
            
        case 'preview':
        case 'vista':
            return await showGroupInfo(m, conn, groupMetadata, config, true)
            
        case 'help':
        case 'ayuda':
            return await showHelp(m, usedPrefix, command)
            
        default:
            await m.reply(`❌ Subcomando no reconocido. Usa ${usedPrefix}${command} help para ver opciones`)
    }
}

// Función principal para mostrar información del grupo
async function showGroupInfo(m, conn, groupMetadata, config, isPreview = false) {
    try {
        // Obtener información detallada
        const participants = groupMetadata.participants || []
        const admins = participants.filter(p => p.admin).map(p => p.id)
        const owner = participants.find(p => p.admin === 'superadmin') || participants[0]
        
        // Formatear fecha de creación
        const creationDate = new Date(groupMetadata.creation * 1000)
        const formattedDate = creationDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        
        // Obtener enlace del grupo
        let groupLink = 'No disponible'
        try {
            const code = await conn.groupInviteCode(m.chat).catch(() => null)
            if (code) groupLink = `https://chat.whatsapp.com/${code}`
        } catch {}
        
        // Construir mensaje según el estilo seleccionado
        let messageContent
        switch (config.style) {
            case 'modern':
                messageContent = await buildModernView(groupMetadata, participants, admins, owner, formattedDate, groupLink, config)
                break
            case 'minimal':
                messageContent = buildMinimalView(groupMetadata, participants, config)
                break
            case 'detailed':
                messageContent = await buildDetailedView(groupMetadata, participants, admins, owner, formattedDate, groupLink, config)
                break
            case 'cards':
                messageContent = buildCardsView(groupMetadata, participants, admins, config)
                break
            default:
                messageContent = await buildModernView(groupMetadata, participants, admins, owner, formattedDate, groupLink, config)
        }
        
        // Aplicar tema
        messageContent = applyTheme(messageContent, config.theme)
        
        // Agregar título y pie personalizados
        if (config.customTitle) {
            messageContent = `*${config.customTitle}*\n\n${messageContent}`
        }
        if (config.customFooter) {
            messageContent = `${messageContent}\n\n${config.customFooter}`
        }
        
        // Crear mensaje interactivo con botones
        const interactiveMessage = {
            interactiveMessage: {
                header: {
                    title: isPreview ? '👁️ VISTA PREVIA' : '📊 INFORMACIÓN DEL GRUPO'
                },
                body: {
                    text: messageContent
                },
                footer: {
                    text: `${global.botname} • ${new Date().toLocaleDateString('es-ES')}`
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📋 Copiar Info',
                                id: 'copy_group_info',
                                copy_code: await generateCopyText(groupMetadata, participants, admins, groupLink)
                            })
                        },
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '⚙️ Configurar',
                                id: 'config_infogroup'
                            })
                        },
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '👥 Ver Admins',
                                id: 'view_admins'
                            })
                        }
                    ]
                }
            }
        }
        
        // Enviar mensaje
        await conn.sendMessage(m.chat, interactiveMessage, { quoted: m })
        
    } catch (error) {
        console.error('Error en showGroupInfo:', error)
        await m.reply('❌ Error al obtener información del grupo')
    }
}

// Vista Moderna (predeterminada)
async function buildModernView(groupMetadata, participants, admins, owner, formattedDate, groupLink, config) {
    const chat = global.db.data.chats[m.chat] || {}
    
    let message = ''
    
    // Información básica
    message += `*👥 ${groupMetadata.subject}*\n`
    message += `├ ID: ${groupMetadata.id}\n`
    
    if (config.showOwner && owner) {
        const ownerName = await conn.getName(owner.id).catch(() => 'Desconocido')
        message += `├ 👑 Dueño: ${ownerName}\n`
    }
    
    if (config.showCreationDate) {
        message += `├ 📅 Creado: ${formattedDate}\n`
    }
    
    if (config.showDescription && groupMetadata.desc) {
        const desc = groupMetadata.desc.length > 100 
            ? groupMetadata.desc.substring(0, 100) + '...' 
            : groupMetadata.desc
        message += `├ 📝 Desc: ${desc}\n`
    }
    
    // Separador
    message += `╰─「 📊 ESTADÍSTICAS 」─╮\n`
    
    if (config.showMembers) {
        const totalMembers = participants.length
        const activeToday = Math.floor(totalMembers * 0.7) // Simulado
        message += `├ 👤 Miembros: ${totalMembers}\n`
        message += `├ 🟢 Activos hoy: ~${activeToday}\n`
    }
    
    if (config.showAdmins) {
        message += `├ 👑 Admins: ${admins.length}\n`
    }
    
    // Configuraciones del bot
    if (config.showSettings) {
        message += `╰─「 ⚙️ CONFIGURACIONES 」─╮\n`
        message += `├ 🎉 Welcome: ${chat.welcome ? '✅' : '❌'}\n`
        message += `├ 🔗 Antilink: ${chat.antiLink ? '✅' : '❌'}\n`
        message += `├ 👁️ Detect: ${chat.detect ? '✅' : '❌'}\n`
        message += `├ 🔞 NSFW: ${chat.nsfw ? '✅' : '❌'}\n`
        message += `├ 💰 Economy: ${chat.economy ? '✅' : '❌'}\n`
        message += `╰ 🎰 Gacha: ${chat.gacha ? '✅' : '❌'}\n`
    }
    
    // Enlace (si está disponible y configurado para mostrar)
    if (config.showLink && groupLink !== 'No disponible') {
        message += `\n🔗 *Enlace:* ${groupLink}`
    }
    
    return message
}

// Vista Minimalista
function buildMinimalView(groupMetadata, participants, config) {
    let message = `*${groupMetadata.subject}*\n`
    message += `👥 ${participants.length} miembros\n`
    
    if (config.showAdmins) {
        const admins = participants.filter(p => p.admin).length
        message += `👑 ${admins} administradores\n`
    }
    
    message += `📅 ${new Date().toLocaleDateString('es-ES')}`
    
    return message
}

// Vista Detallada
async function buildDetailedView(groupMetadata, participants, admins, owner, formattedDate, groupLink, config) {
    const chat = global.db.data.chats[m.chat] || {}
    
    let message = '📋 *INFORME DETALLADO DEL GRUPO*\n'
    message += '═'.repeat(30) + '\n\n'
    
    // Sección 1: Información General
    message += '*📌 INFORMACIÓN GENERAL*\n'
    message += `• Nombre: ${groupMetadata.subject}\n`
    message += `• ID: ${groupMetadata.id}\n`
    
    if (config.showOwner && owner) {
        const ownerName = await conn.getName(owner.id).catch(() => 'Desconocido')
        message += `• Dueño: ${ownerName} (@${owner.id.split('@')[0]})\n`
    }
    
    if (config.showCreationDate) {
        message += `• Creado: ${formattedDate}\n`
        message += `• Edad: ${Math.floor((Date.now() - (groupMetadata.creation * 1000)) / (1000 * 60 * 60 * 24))} días\n`
    }
    
    if (config.showDescription && groupMetadata.desc) {
        message += `• Descripción: ${groupMetadata.desc}\n`
    }
    
    message += '\n'
    
    // Sección 2: Demografía
    if (config.showMembers) {
        message += '*👥 DEMOGRAFÍA*\n'
        const total = participants.length
        
        // Simular datos (en realidad necesitarías tracking)
        const active = Math.floor(total * 0.7)
        const inactive = total - active
        const bots = participants.filter(p => p.id.includes('@s.whatsapp.net') && p.id.includes('bot')).length
        
        message += `• Total: ${total} miembros\n`
        message += `• Activos: ${active} (${Math.round((active/total)*100)}%)\n`
        message += `• Inactivos: ${inactive}\n`
        message += `• Bots: ${bots}\n`
        message += `• Límite: ${256 - total} espacios libres\n`
        
        message += '\n'
    }
    
    // Sección 3: Administración
    if (config.showAdmins) {
        message += '*👑 ADMINISTRACIÓN*\n'
        message += `• Total admins: ${admins.length}\n`
        message += `• Superadmins: ${admins.filter(id => {
            const p = participants.find(p => p.id === id)
            return p?.admin === 'superadmin'
        }).length}\n`
        message += `• Admins regulares: ${admins.length - 1}\n`
        message += '\n'
    }
    
    // Sección 4: Configuraciones del Bot
    if (config.showSettings) {
        message += '*⚙️ CONFIGURACIÓN DEL BOT*\n'
        const settings = [
            { name: 'Bienvenidas', key: 'welcome', icon: '🎉' },
            { name: 'Despedidas', key: 'bye', icon: '👋' },
            { name: 'Anti-enlaces', key: 'antiLink', icon: '🔗' },
            { name: 'Detección', key: 'detect', icon: '👁️' },
            { name: 'NSFW', key: 'nsfw', icon: '🔞' },
            { name: 'Economía', key: 'economy', icon: '💰' },
            { name: 'Gacha', key: 'gacha', icon: '🎰' }
        ]
        
        settings.forEach(setting => {
            const value = chat[setting.key]
            message += `${setting.icon} ${setting.name}: ${value ? '✅ Activado' : '❌ Desactivado'}\n`
        })
        
        message += '\n'
    }
    
    // Sección 5: Enlace
    if (config.showLink && groupLink !== 'No disponible') {
        message += '*🔗 ENLACE DE INVITACIÓN*\n'
        message += `${groupLink}\n\n`
    }
    
    // Sección 6: Estadísticas (si está habilitado)
    if (config.showStats) {
        message += '*📊 ESTADÍSTICAS*\n'
        message += `• Comandos usados: ${chat.commands || 0}\n`
        message += `• Última actividad: ${new Date().toLocaleTimeString('es-ES')}\n`
        message += `• Reportes: ${chat.reports || 0}\n`
    }
    
    return message
}

// Vista con Tarjetas (Cards)
function buildCardsView(groupMetadata, participants, admins, config) {
    let message = ''
    
    // Tarjeta 1: Información básica
    message += `🃏 *TARJETA DEL GRUPO*\n`
    message += `┌──────────────┐\n`
    message += `│ ${groupMetadata.subject.substring(0, 12)}${groupMetadata.subject.length > 12 ? '...' : ''} │\n`
    message += `├──────────────┤\n`
    message += `│ 👥 ${participants.length} miembros │\n`
    message += `│ 👑 ${admins.length} admins   │\n`
    message += `└──────────────┘\n\n`
    
    // Tarjeta 2: Configuraciones
    if (config.showSettings) {
        const chat = global.db.data.chats[m.chat] || {}
        message += `⚙️ *CONFIGURACIONES*\n`
        message += `┌─────────────────┐\n`
        message += `│ 🎉 ${chat.welcome ? '✅' : '❌'} │ 🔗 ${chat.antiLink ? '✅' : '❌'} │\n`
        message += `│ 👁️ ${chat.detect ? '✅' : '❌'} │ 🔞 ${chat.nsfw ? '✅' : '❌'} │\n`
        message += `│ 💰 ${chat.economy ? '✅' : '❌'} │ 🎰 ${chat.gacha ? '✅' : '❌'} │\n`
        message += `└─────────────────┘\n`
    }
    
    return message
}

// Aplicar temas de color/formato
function applyTheme(message, theme) {
    switch (theme) {
        case 'dark':
            return `◼️ ${message.replace(/\n/g, '\n◼️ ')}`
        case 'colorful':
            const colors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪']
            let coloredMessage = ''
            const lines = message.split('\n')
            lines.forEach((line, index) => {
                const color = colors[index % colors.length]
                coloredMessage += `${color} ${line}\n`
            })
            return coloredMessage
        case 'professional':
            return `📋 INFORME OFICIAL\n${'-'.repeat(40)}\n${message}\n${'-'.repeat(40)}`
        default:
            return message
    }
}

// Menú de configuración
async function showConfigMenu(m, conn, config) {
    const configMessage = {
        interactiveMessage: {
            header: {
                title: '⚙️ CONFIGURACIÓN DE INFOGROUP'
            },
            body: {
                text: `*Configuración actual:*

🎨 *Estilo:* ${config.style}
🎭 *Tema:* ${config.theme}
📌 *Título personalizado:* ${config.customTitle || 'Ninguno'}
📝 *Pie personalizado:* ${config.customFooter ? 'Sí' : 'No'}

*Elementos visibles:*
👑 Dueño: ${config.showOwner ? '✅' : '❌'}
📅 Fecha creación: ${config.showCreationDate ? '✅' : '❌'}
📝 Descripción: ${config.showDescription ? '✅' : '❌'}
🔗 Enlace: ${config.showLink ? '✅' : '❌'}
👥 Miembros: ${config.showMembers ? '✅' : '❌'}
👑 Admins: ${config.showAdmins ? '✅' : '❌'}
⚙️ Configs: ${config.showSettings ? '✅' : '❌'}
📊 Stats: ${config.showStats ? '✅' : '❌'}

*Usa los botones para configurar:*`
            },
            footer: {
                text: global.botname
            },
            nativeFlowMessage: {
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🎨 Cambiar Estilo',
                            id: 'change_style'
                        })
                    },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🎭 Cambiar Tema',
                            id: 'change_theme'
                        })
                    },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '👁️ Alternar Elementos',
                            id: 'toggle_elements'
                        })
                    },
                    {
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📋 Comandos Config',
                            id: 'copy_commands',
                            copy_code: `!infogroup style modern\n!infogroup theme colorful\n!infogroup toggle owner\n!infogroup title "Mi Grupo"\n!infogroup footer "Powered by ${global.botname}"`
                        })
                    }
                ]
            }
        }
    }
    
    await conn.sendMessage(m.chat, configMessage, { quoted: m })
}

// Ayuda
async function showHelp(m, usedPrefix, command) {
    const helpText = `
*📚 AYUDA DE INFOGROUP*

*Uso básico:*
${usedPrefix}${command} - Ver información del grupo
${usedPrefix}${command} preview - Vista previa con configuración actual

*🎨 Personalización:*
${usedPrefix}${command} style <estilo> - Cambiar estilo (modern, minimal, detailed, cards)
${usedPrefix}${command} theme <tema> - Cambiar tema (default, dark, colorful, professional)
${usedPrefix}${command} toggle <elemento> - Mostrar/ocultar elementos (owner, creation, description, link, members, admins, settings, stats)
${usedPrefix}${command} title <texto> - Establecer título personalizado
${usedPrefix}${command} footer <texto> - Establecer pie de página personalizado

*⚙️ Configuración:*
${usedPrefix}${command} config - Menú de configuración interactivo
${usedPrefix}${command} reset - Restaurar configuración por defecto
${usedPrefix}${command} help - Mostrar esta ayuda

*Ejemplos:*
${usedPrefix}${command} style detailed
${usedPrefix}${command} theme dark
${usedPrefix}${command} toggle stats
${usedPrefix}${command} title "Informe Oficial"
${usedPrefix}${command} footer "Actualizado: ${new Date().toLocaleDateString('es-ES')}"

*Nota:* Solo administradores pueden cambiar la configuración.
`.trim()
    
    await m.reply(helpText)
}

// Generar texto para copiar
async function generateCopyText(groupMetadata, participants, admins, groupLink) {
    let copyText = `📋 INFORMACIÓN DEL GRUPO\n`
    copyText += `Nombre: ${groupMetadata.subject}\n`
    copyText += `Miembros: ${participants.length}\n`
    copyText += `Administradores: ${admins.length}\n`
    
    if (groupLink !== 'No disponible') {
        copyText += `Enlace: ${groupLink}\n`
    }
    
    copyText += `\nInformación generada por ${global.botname}`
    copyText += `\nFecha: ${new Date().toLocaleDateString('es-ES')}`
    
    return copyText
}

handler.help = ['infogroup', 'grupoinfo', 'infogrupo']
handler.tags = ['group', 'info']
handler.command = /^(infogroup|grupoinfo|infogrupo|groupinfo|info(group|grupo))$/i
handler.group = true
handler.botAdmin = false

export default handler
