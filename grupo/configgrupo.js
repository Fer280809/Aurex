// plugins/group/configgrupo.js
import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

let handler = async (m, { conn, usedPrefix, command, text }) => {
    if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos.')
    
    const chat = global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {}
    const user = global.db.data.users[m.sender] || {}
    
    // Verificar permisos de administrador
    let groupMetadata
    try {
        groupMetadata = await conn.groupMetadata(m.chat)
    } catch (error) {
        return m.reply('❌ No se pudo obtener información del grupo.')
    }
    
    const participant = groupMetadata.participants.find(p => p.id === m.sender)
    const isOwner = [...global.owner.map(v => v.replace(/\D/g, "") + "@s.whatsapp.net")].includes(m.sender)
    
    if (!participant?.admin && !isOwner) {
        return m.reply('❌ Solo los administradores pueden configurar el grupo.')
    }
    
    // Configuración de configgrupo personalizada
    chat.configgrupoConfig = chat.configgrupoConfig || {
        activeSection: 'general',
        viewMode: 'cards', // cards, list, detailed
        showQuickActions: true,
        confirmChanges: true,
        theme: 'default'
    }
    
    const config = chat.configgrupoConfig
    
    // Subcomandos
    const args = text ? text.trim().split(' ') : []
    const subcmd = args[0] ? args[0].toLowerCase() : ''
    
    // Si no hay subcomando, mostrar panel principal
    if (!subcmd) {
        return await showMainPanel(m, conn, groupMetadata, chat, config)
    }
    
    // Manejar subcomandos
    switch (subcmd) {
        case 'section':
        case 'seccion':
            const section = args[1]
            const validSections = ['general', 'seguridad', 'diversion', 'bot', 'avanzado']
            if (!section || !validSections.includes(section)) {
                return m.reply(`📂 *Secciones disponibles:*\n${validSections.map(s => `• ${s}`).join('\n')}\n\nUso: ${usedPrefix}${command} section <nombre>`)
            }
            config.activeSection = section
            await m.reply(`✅ Sección cambiada a: *${section}*`)
            break
            
        case 'view':
        case 'vista':
            const view = args[1]
            const validViews = ['cards', 'list', 'detailed']
            if (!view || !validViews.includes(view)) {
                return m.reply(`👁️ *Vistas disponibles:*\n${validViews.map(v => `• ${v}`).join('\n')}\n\nUso: ${usedPrefix}${command} view <nombre>`)
            }
            config.viewMode = view
            await m.reply(`✅ Vista cambiada a: *${view}*`)
            break
            
        case 'theme':
        case 'tema':
            const theme = args[1]
            const validThemes = ['default', 'dark', 'colorful', 'minimal']
            if (!theme || !validThemes.includes(theme)) {
                return m.reply(`🎨 *Temas disponibles:*\n${validThemes.map(t => `• ${t}`).join('\n')}\n\nUso: ${usedPrefix}${command} theme <nombre>`)
            }
            config.theme = theme
            await m.reply(`✅ Tema cambiado a: *${theme}*`)
            break
            
        case 'toggle':
        case 'alternar':
            const toggleOption = args[1]
            if (toggleOption === 'confirm') {
                config.confirmChanges = !config.confirmChanges
                await m.reply(`✅ Confirmación de cambios ${config.confirmChanges ? 'activada' : 'desactivada'}`)
            } else if (toggleOption === 'quickactions') {
                config.showQuickActions = !config.showQuickActions
                await m.reply(`✅ Acciones rápidas ${config.showQuickActions ? 'mostradas' : 'ocultas'}`)
            } else {
                await m.reply(`⚙️ *Opciones para alternar:*\n• confirm - Confirmación de cambios\n• quickactions - Mostrar acciones rápidas`)
            }
            break
            
        case 'apply':
        case 'aplicar':
            const setting = args[1]
            const value = args[2]
            
            if (!setting || !value) {
                return m.reply(`🔄 *Uso:* ${usedPrefix}${command} apply <config> <valor>\n\nEjemplo: ${usedPrefix}${command} apply welcome on`)
            }
            
            return await applySetting(m, conn, chat, setting, value)
            
        case 'reset':
        case 'reiniciar':
            chat.configgrupoConfig = {
                activeSection: 'general',
                viewMode: 'cards',
                showQuickActions: true,
                confirmChanges: true,
                theme: 'default'
            }
            await m.reply('✅ Configuración del panel restaurada a valores por defecto')
            break
            
        case 'backup':
        case 'respaldar':
            const backupData = generateBackup(chat)
            await m.reply(`📦 *Respaldo generado*\n\n\`\`\`json\n${JSON.stringify(backupData, null, 2)}\n\`\`\`\n\nGuarda este código para restaurar después.`)
            break
            
        case 'help':
        case 'ayuda':
            return await showHelp(m, usedPrefix, command)
            
        default:
            // Verificar si es una configuración directa
            if (Object.keys(availableSettings).includes(subcmd)) {
                const value = args.slice(1).join(' ')
                return await handleDirectSetting(m, conn, chat, subcmd, value, config)
            }
            await m.reply(`❌ Subcomando no reconocido. Usa ${usedPrefix}${command} help`)
    }
}

// Configuraciones disponibles
const availableSettings = {
    // Configuraciones generales del grupo
    'name': {
        name: 'Nombre del grupo',
        type: 'text',
        category: 'general',
        description: 'Cambiar el nombre del grupo',
        command: 'name',
        requires: 'admin'
    },
    'desc': {
        name: 'Descripción',
        type: 'text',
        category: 'general',
        description: 'Cambiar la descripción del grupo',
        command: 'desc',
        requires: 'admin'
    },
    'icon': {
        name: 'Icono/Foto',
        type: 'media',
        category: 'general',
        description: 'Cambiar la foto del grupo',
        command: 'icon',
        requires: 'admin'
    },
    
    // Configuraciones de seguridad
    'antilink': {
        name: 'Anti-enlaces',
        type: 'toggle',
        category: 'seguridad',
        description: 'Bloquear enlaces de otros grupos',
        command: 'antilink',
        requires: 'admin'
    },
    'antinsfw': {
        name: 'Anti-NSFW',
        type: 'toggle',
        category: 'seguridad',
        description: 'Bloquear contenido +18',
        command: 'nsfw',
        requires: 'admin'
    },
    'antifake': {
        name: 'Anti-fake',
        type: 'toggle',
        category: 'seguridad',
        description: 'Bloquear números falsos',
        command: 'antifake',
        requires: 'admin'
    },
    'antispam': {
        name: 'Anti-spam',
        type: 'toggle',
        category: 'seguridad',
        description: 'Protección contra spam',
        command: 'antispam',
        requires: 'admin'
    },
    
    // Configuraciones del bot
    'welcome': {
        name: 'Bienvenidas',
        type: 'toggle',
        category: 'bot',
        description: 'Mensajes de bienvenida',
        command: 'welcome',
        requires: 'admin'
    },
    'detect': {
        name: 'Detección',
        type: 'toggle',
        category: 'bot',
        description: 'Detección automática',
        command: 'detect',
        requires: 'admin'
    },
    'economy': {
        name: 'Economía',
        type: 'toggle',
        category: 'bot',
        description: 'Sistema económico',
        command: 'economy',
        requires: 'admin'
    },
    'gacha': {
        name: 'Gacha',
        type: 'toggle',
        category: 'bot',
        description: 'Sistema de gacha',
        command: 'gacha',
        requires: 'admin'
    },
    
    // Configuraciones avanzadas
    'modoadmin': {
        name: 'Modo Admin',
        type: 'toggle',
        category: 'avanzado',
        description: 'Solo admins pueden usar comandos',
        command: 'modoadmin',
        requires: 'admin'
    },
    'antiprivate': {
        name: 'Anti-privado',
        type: 'toggle',
        category: 'avanzado',
        description: 'Bloquear mensajes privados del bot',
        command: 'antiprivate',
        requires: 'owner'
    },
    'gponly': {
        name: 'Solo grupos',
        type: 'toggle',
        category: 'avanzado',
        description: 'Bot solo responde en grupos',
        command: 'gponly',
        requires: 'owner'
    }
}

// Panel principal
async function showMainPanel(m, conn, groupMetadata, chat, config) {
    try {
        const currentSection = config.activeSection
        const settingsInSection = Object.entries(availableSettings)
            .filter(([key, setting]) => setting.category === currentSection)
        
        let panelMessage = ''
        
        // Construir mensaje según la vista
        switch (config.viewMode) {
            case 'cards':
                panelMessage = await buildCardsView(m, conn, groupMetadata, chat, settingsInSection, currentSection)
                break
            case 'list':
                panelMessage = buildListView(settingsInSection, currentSection, chat)
                break
            case 'detailed':
                panelMessage = await buildDetailedView(m, conn, groupMetadata, chat, settingsInSection, currentSection)
                break
            default:
                panelMessage = await buildCardsView(m, conn, groupMetadata, chat, settingsInSection, currentSection)
        }
        
        // Aplicar tema
        panelMessage = applyTheme(panelMessage, config.theme)
        
        // Crear mensaje interactivo
        const interactiveMessage = {
            interactiveMessage: {
                header: {
                    title: `⚙️ PANEL DE CONFIGURACIÓN • ${currentSection.toUpperCase()}`
                },
                body: {
                    text: panelMessage
                },
                footer: {
                    text: `${groupMetadata.subject} • ${global.botname}`
                },
                nativeFlowMessage: {
                    buttons: buildPanelButtons(currentSection, config)
                }
            }
        }
        
        await conn.sendMessage(m.chat, interactiveMessage, { quoted: m })
        
    } catch (error) {
        console.error('Error en showMainPanel:', error)
        await m.reply('❌ Error al mostrar el panel de configuración')
    }
}

// Vista tipo tarjetas
async function buildCardsView(m, conn, groupMetadata, chat, settings, section) {
    let message = `📁 *${section.toUpperCase()}*\n\n`
    
    // Información del grupo
    if (section === 'general') {
        message += `👥 *${groupMetadata.subject}*\n`
        message += `├ 📝 Desc: ${groupMetadata.desc || 'Sin descripción'}\n`
        message += `├ 👤 Miembros: ${groupMetadata.participants?.length || 0}\n`
        message += `├ 👑 Admins: ${groupMetadata.participants?.filter(p => p.admin).length || 0}\n`
        message += `╰ 🔗 Enlace: ${await getGroupLink(conn, m.chat) || 'No disponible'}\n\n`
    }
    
    // Tarjetas de configuración
    for (const [key, setting] of settings) {
        const currentValue = chat[setting.command] || false
        const status = setting.type === 'toggle' 
            ? (currentValue ? '🟢 ACTIVADO' : '🔴 DESACTIVADO')
            : chat[setting.command] || 'No configurado'
        
        message += `🃏 *${setting.name}*\n`
        message += `┌──────────────┐\n`
        message += `│ ${setting.type === 'toggle' ? (currentValue ? '✅' : '❌') : '⚙️'} ${setting.type.toUpperCase()} │\n`
        message += `├──────────────┤\n`
        message += `│ ${status.substring(0, 12)}${status.length > 12 ? '...' : ''} │\n`
        message += `└──────────────┘\n\n`
    }
    
    return message
}

// Vista de lista
function buildListView(settings, section, chat) {
    let message = `📋 *CONFIGURACIONES - ${section.toUpperCase()}*\n\n`
    
    settings.forEach(([key, setting], index) => {
        const currentValue = chat[setting.command]
        const status = setting.type === 'toggle'
            ? (currentValue ? '✅' : '❌')
            : currentValue || 'No configurado'
        
        message += `${index + 1}. *${setting.name}* ${status}\n`
        message += `   📝 ${setting.description}\n`
        message += `   🔧 Comando: ${setting.command}\n\n`
    })
    
    return message
}

// Vista detallada
async function buildDetailedView(m, conn, groupMetadata, chat, settings, section) {
    let message = `⚙️ *PANEL DE CONFIGURACIÓN DETALLADO*\n`
    message += '═'.repeat(40) + '\n\n'
    
    message += `📂 *Sección:* ${section}\n`
    message += `👥 *Grupo:* ${groupMetadata.subject}\n`
    message += `📅 *Actualizado:* ${new Date().toLocaleDateString('es-ES')}\n\n`
    
    message += '📊 *ESTADO ACTUAL:*\n'
    settings.forEach(([key, setting]) => {
        const currentValue = chat[setting.command]
        let displayValue
        
        if (setting.type === 'toggle') {
            displayValue = currentValue ? '✅ **Activado**' : '❌ **Desactivado**'
        } else if (setting.type === 'text') {
            displayValue = currentValue ? `"${currentValue.substring(0, 50)}${currentValue.length > 50 ? '...' : ''}"` : 'No configurado'
        } else {
            displayValue = currentValue || 'No configurado'
        }
        
        message += `\n🔸 *${setting.name}*\n`
        message += `   ${displayValue}\n`
        message += `   📝 ${setting.description}\n`
        message += `   🔐 Requiere: ${setting.requires === 'owner' ? 'Dueño del bot' : 'Administrador'}\n`
    })
    
    return message
}

// Construir botones del panel
function buildPanelButtons(section, config) {
    const sections = ['general', 'seguridad', 'bot', 'avanzado', 'diversion']
    const currentIndex = sections.indexOf(section)
    
    const buttons = [
        {
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({
                display_text: '📋 Comandos Rápidos',
                id: 'quick_commands',
                copy_code: generateQuickCommands(section)
            })
        }
    ]
    
    // Botones de navegación
    if (currentIndex > 0) {
        buttons.push({
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
                display_text: '⬅️ Anterior',
                id: `prev_section_${sections[currentIndex - 1]}`
            })
        })
    }
    
    if (currentIndex < sections.length - 1 && sections[currentIndex + 1]) {
        buttons.push({
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
                display_text: 'Siguiente ➡️',
                id: `next_section_${sections[currentIndex + 1]}`
            })
        })
    }
    
    // Acciones rápidas si están activadas
    if (config.showQuickActions) {
        buttons.push({
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
                display_text: '⚡ Acciones',
                id: 'quick_actions'
            })
        })
    }
    
    return buttons
}

// Aplicar tema
function applyTheme(message, theme) {
    switch (theme) {
        case 'dark':
            return `◼️ PANEL DE CONFIGURACIÓN\n${message.replace(/\n/g, '\n◼️ ')}`
        case 'colorful':
            const colors = ['🔵', '🟢', '🟡', '🟠', '🔴', '🟣']
            let colored = ''
            message.split('\n').forEach((line, i) => {
                colored += `${colors[i % colors.length]} ${line}\n`
            })
            return colored
        case 'minimal':
            return message.replace(/[🃏📋⚙️🔸📂👥📅📊🔸]/g, '•')
        default:
            return message
    }
}

// Aplicar configuración
async function applySetting(m, conn, chat, setting, value) {
    const settingConfig = availableSettings[setting]
    
    if (!settingConfig) {
        return m.reply(`❌ Configuración "${setting}" no encontrada.`)
    }
    
    // Verificar permisos
    if (settingConfig.requires === 'owner') {
        const isOwner = [...global.owner.map(v => v.replace(/\D/g, "") + "@s.whatsapp.net")].includes(m.sender)
        if (!isOwner) {
            return m.reply('❌ Esta configuración solo puede ser cambiada por el dueño del bot.')
        }
    }
    
    let newValue
    let successMessage
    
    switch (settingConfig.type) {
        case 'toggle':
            newValue = ['on', 'true', 'yes', '1', 'activar', 'enable'].includes(value.toLowerCase())
            successMessage = `${settingConfig.name} ${newValue ? 'activado' : 'desactivado'}`
            
            if (setting === 'name' || setting === 'desc' || setting === 'icon') {
                // Para configuraciones del grupo, necesitamos usar funciones específicas
                try {
                    if (setting === 'name' && value) {
                        await conn.groupUpdateSubject(m.chat, value)
                        successMessage = `Nombre del grupo cambiado a: "${value}"`
                    } else if (setting === 'desc' && value) {
                        await conn.groupUpdateDescription(m.chat, value)
                        successMessage = `Descripción cambiada a: "${value.substring(0, 100)}${value.length > 100 ? '...' : ''}"`
                    }
                } catch (error) {
                    return m.reply(`❌ Error al cambiar ${settingConfig.name}: ${error.message}`)
                }
            }
            break
            
        case 'text':
            newValue = value
            successMessage = `${settingConfig.name} actualizado`
            break
            
        default:
            return m.reply(`❌ Tipo de configuración no soportado: ${settingConfig.type}`)
    }
    
    // Guardar en la base de datos (excepto para name/desc/icon que se manejan directamente en WhatsApp)
    if (!['name', 'desc', 'icon'].includes(setting)) {
        chat[settingConfig.command] = newValue
    }
    
    await m.reply(`✅ ${successMessage}`)
}

// Manejar configuración directa
async function handleDirectSetting(m, conn, chat, setting, value, config) {
    const settingConfig = availableSettings[setting]
    
    if (!value) {
        // Mostrar estado actual
        const currentValue = chat[settingConfig.command]
        let displayValue
        
        if (settingConfig.type === 'toggle') {
            displayValue = currentValue ? '✅ Activado' : '❌ Desactivado'
        } else {
            displayValue = currentValue || 'No configurado'
        }
        
        return m.reply(`⚙️ *${settingConfig.name}*\n\nEstado: ${displayValue}\n\nPara cambiar:\n${usedPrefix}${command} ${setting} <valor>\n\nEjemplo: ${usedPrefix}${command} ${setting} ${settingConfig.type === 'toggle' ? 'on/off' : 'nuevo_valor'}`)
    }
    
    return await applySetting(m, conn, chat, setting, value)
}

// Generar comandos rápidos
function generateQuickCommands(section) {
    const commands = {
        general: `!configgrupo name "Nuevo nombre"\n!configgrupo desc "Nueva descripción"\n!infogroup`,
        seguridad: `!configgrupo antilink on\n!configgrupo antinsfw off\n!configgrupo antifake on`,
        bot: `!configgrupo welcome on\n!setwelcome\n!configgrupo economy off`,
        avanzado: `!configgrupo modoadmin on\n!configgrupo antiprivate off`,
        diversion: `!configgrupo gacha on\n!economy config`
    }
    
    return commands[section] || '!configgrupo help'
}

// Obtener enlace del grupo
async function getGroupLink(conn, chatId) {
    try {
        const code = await conn.groupInviteCode(chatId)
        return `https://chat.whatsapp.com/${code}`
    } catch {
        return null
    }
}

// Generar respaldo
function generateBackup(chat) {
    const backup = {
        timestamp: new Date().toISOString(),
        chatId: m?.chat || 'unknown',
        settings: {}
    }
    
    // Solo guardar configuraciones que existen en availableSettings
    Object.keys(availableSettings).forEach(key => {
        const setting = availableSettings[key]
        if (chat[setting.command] !== undefined) {
            backup.settings[setting.command] = chat[setting.command]
        }
    })
    
    return backup
}

// Mostrar ayuda
async function showHelp(m, usedPrefix, command) {
    const helpText = `
*📚 AYUDA DE CONFIGGRUPO*

*Panel interactivo:*
${usedPrefix}${command} - Mostrar panel principal
${usedPrefix}${command} section <nombre> - Cambiar sección (general, seguridad, bot, avanzado, diversion)
${usedPrefix}${command} view <tipo> - Cambiar vista (cards, list, detailed)
${usedPrefix}${command} theme <tema> - Cambiar tema (default, dark, colorful, minimal)

*Configuraciones directas:*
${usedPrefix}${command} <config> <valor> - Cambiar configuración directamente
${usedPrefix}${command} <config> - Ver estado de configuración

*Ejemplos de configuraciones:*
${usedPrefix}${command} welcome on - Activar bienvenidas
${usedPrefix}${command} antilink off - Desactivar anti-enlaces
${usedPrefix}${command} name "Mi Grupo" - Cambiar nombre
${usedPrefix}${command} desc "Descripción" - Cambiar descripción

*Otros comandos:*
${usedPrefix}${command} backup - Generar respaldo de configuración
${usedPrefix}${command} reset - Restaurar panel a valores por defecto
${usedPrefix}${command} help - Mostrar esta ayuda

*Secciones disponibles:*
• general - Nombre, descripción, icono
• seguridad - Antilink, antinsfw, antifake, antispam
• bot - Bienvenidas, detección, economía, gacha
• avanzado - Modo admin, anti-privado, solo grupos
• diversion - Próximamente...

*Nota:* Algunas configuraciones requieren permisos de administrador o dueño.
`.trim()
    
    await m.reply(helpText)
}

handler.help = ['configgrupo', 'panelconfig', 'configpanel']
handler.tags = ['group', 'config']
handler.command = /^(configgrupo|panelconfig|configpanel|gruposettings)$/i
handler.group = true
handler.admin = true

export default handler
