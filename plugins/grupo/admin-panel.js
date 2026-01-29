import moment from 'moment-timezone'

const handler = async (m, { conn, usedPrefix, participants, groupMetadata, args, isAdmin, isBotAdmin, isOwner, isROwner }) => {
    try {
        // Verificar que sea un grupo
        if (!m.isGroup) return m.reply('⚠️ Este comando solo está disponible en grupos.')
        
        // Verificar permisos
        if (!isAdmin && !isOwner) return m.reply('🚫 Necesitas ser administrador para usar este panel.')
        if (!isBotAdmin) return m.reply('🤖 El bot necesita ser administrador para usar todas las funciones.')

        // Obtener datos del grupo
        const groupInfo = await conn.groupMetadata(m.chat)
        const ownerGroup = groupInfo.owner || groupInfo.participants.find(p => p.admin === 'superadmin')?.id || m.chat.split('-')[0] + '@s.whatsapp.net'
        const totalMembers = participants.length
        const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin')
        const totalAdmins = admins.length
        
        // Función para obtener nombre formateado
        const getName = async (jid) => {
            try {
                const name = await conn.getName(jid)
                return name || jid.split('@')[0]
            } catch {
                return jid.split('@')[0]
            }
        }

        // Panel principal
        if (!args[0] || args[0] === 'menu') {
            const ownerName = await getName(ownerGroup)
            const hora = moment.tz('America/Caracas').format('DD/MM/YYYY hh:mm:ss A')
            
            const panelText = `╭═══════════════════
║  🛠️ *PANEL DE CONTROL* 🛠️
║  ────────────────
║  👑 *Creador:* ${ownerName}
║  👥 *Miembros:* ${totalMembers}
║  ⚡ *Admins:* ${totalAdmins}
║  📅 *Fecha:* ${hora}
║  ────────────────
║  💡 _Selecciona una opción:_
╰═══════════════════`

            await conn.sendMessage(m.chat, {
                text: panelText,
                footer: global.textbot,
                templateButtons: [
                    {
                        index: 1,
                        urlButton: {
                            displayText: '📱 Contacto',
                            url: 'https://wa.me/5214183357841'
                        }
                    },
                    {
                        index: 2,
                        quickReplyButton: {
                            displayText: '👤 Gestionar Usuarios',
                            id: `${usedPrefix}panel usuarios`
                        }
                    },
                    {
                        index: 3,
                        quickReplyButton: {
                            displayText: '⚙️ Configurar Grupo',
                            id: `${usedPrefix}panel config`
                        }
                    },
                    {
                        index: 4,
                        quickReplyButton: {
                            displayText: '🔧 Herramientas Avanzadas',
                            id: `${usedPrefix}panel herramientas`
                        }
                    }
                ]
            }, { quoted: m })
            return
        }

        // Sub-paneles
        const subPanel = args[0].toLowerCase()
        
        // PANEL DE USUARIOS
        if (subPanel === 'usuarios') {
            const usuariosText = `╭═══════════════════
║  👤 *GESTIÓN DE USUARIOS*
║  ────────────────
║  📊 *Miembros:* ${totalMembers}
║  ⚡ *Admins:* ${totalAdmins}
║  ────────────────
║  🔹 _Selecciona una acción:_
╰═══════════════════`

            await conn.sendMessage(m.chat, {
                text: usuariosText,
                footer: '💡 Usa los botones para seleccionar',
                templateButtons: [
                    {
                        index: 1,
                        quickReplyButton: {
                            displayText: '➕ Agregar Usuario',
                            id: `${usedPrefix}panel agregar`
                        }
                    },
                    {
                        index: 2,
                        quickReplyButton: {
                            displayText: '👢 Expulsar Usuario',
                            id: `${usedPrefix}panel expulsar`
                        }
                    },
                    {
                        index: 3,
                        quickReplyButton: {
                            displayText: '👑 Promover a Admin',
                            id: `${usedPrefix}panel promover`
                        }
                    },
                    {
                        index: 4,
                        quickReplyButton: {
                            displayText: '📉 Degradar Admin',
                            id: `${usedPrefix}panel degradar`
                        }
                    }
                ]
            }, { quoted: m })
            return
        }

        // PANEL DE CONFIGURACIÓN
        if (subPanel === 'config') {
            const chat = global.db.data.chats[m.chat] || {}
            const configText = `╭═══════════════════
║  ⚙️ *CONFIGURACIÓN DEL GRUPO*
║  ────────────────
║  🔹 Estado actual:
║  • Welcome: ${chat.welcome ? '✅' : '❌'}
║  • Modo Admin: ${chat.modoadmin ? '✅' : '❌'}
║  • Anti-link: ${chat.antiLink ? '✅' : '❌'}
║  • Detect: ${chat.detect ? '✅' : '❌'}
║  ────────────────
║  ⚡ _Cambiar configuración:_
╰═══════════════════`

            await conn.sendMessage(m.chat, {
                text: configText,
                footer: '💡 Activa/Desactiva las funciones',
                templateButtons: [
                    {
                        index: 1,
                        quickReplyButton: {
                            displayText: chat.welcome ? '❌ Desactivar Welcome' : '✅ Activar Welcome',
                            id: `${usedPrefix}welcome ${chat.welcome ? 'disable' : 'enable'}`
                        }
                    },
                    {
                        index: 2,
                        quickReplyButton: {
                            displayText: chat.modoadmin ? '❌ Desactivar Modo Admin' : '✅ Activar Modo Admin',
                            id: `${usedPrefix}modoadmin ${chat.modoadmin ? 'disable' : 'enable'}`
                        }
                    },
                    {
                        index: 3,
                        quickReplyButton: {
                            displayText: chat.antiLink ? '❌ Desactivar Anti-link' : '✅ Activar Anti-link',
                            id: `${usedPrefix}antilink ${chat.antiLink ? 'disable' : 'enable'}`
                        }
                    },
                    {
                        index: 4,
                        quickReplyButton: {
                            displayText: chat.detect ? '❌ Desactivar Detect' : '✅ Activar Detect',
                            id: `${usedPrefix}detect ${chat.detect ? 'disable' : 'enable'}`
                        }
                    }
                ]
            }, { quoted: m })
            return
        }

        // PANEL DE HERRAMIENTAS AVANZADAS
        if (subPanel === 'herramientas') {
            const herramientasText = `╭═══════════════════
║  🔧 *HERRAMIENTAS AVANZADAS*
║  ────────────────
║  🛠️ _Funciones especiales:_
║  • Expulsar por prefijo
║  • Listar por prefijo
║  • Limpieza de números
║  ────────────────
║  ⚡ _Selecciona una opción:_
╰═══════════════════`

            await conn.sendMessage(m.chat, {
                text: herramientasText,
                footer: '⚠️ Estas acciones son irreversibles',
                templateButtons: [
                    {
                        index: 1,
                        quickReplyButton: {
                            displayText: '🔢 Expulsar por Prefijo',
                            id: `${usedPrefix}panel kicknum`
                        }
                    },
                    {
                        index: 2,
                        quickReplyButton: {
                            displayText: '📋 Listar por Prefijo',
                            id: `${usedPrefix}panel listnum`
                        }
                    },
                    {
                        index: 3,
                        quickReplyButton: {
                            displayText: '🧹 Limpiar Inactivos',
                            id: `${usedPrefix}panel limpiar`
                        }
                    },
                    {
                        index: 4,
                        quickReplyButton: {
                            displayText: '📊 Ver Estadísticas',
                            id: `${usedPrefix}panel stats`
                        }
                    }
                ]
            }, { quoted: m })
            return
        }

        // SUB-MENÚS ESPECÍFICOS
        
        // Agregar usuario
        if (subPanel === 'agregar') {
            await m.reply(`📨 *AGREGAR USUARIO*\n\nPara invitar a alguien al grupo, usa:\n\`\`\`${usedPrefix}add 52123456789\`\`\`\n💡 Reemplaza el número por el que deseas invitar.\n\n⚠️ Solo números sin el signo +`)
            return
        }

        // Expulsar usuario
        if (subPanel === 'expulsar') {
            // Crear lista de miembros (excepto el bot y el dueño del grupo)
            const membersList = participants
                .filter(p => p.id !== conn.user.jid && p.id !== ownerGroup)
                .slice(0, 10) // Limitar a 10 para no saturar
                .map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`)
                .join('\n')

            await conn.sendMessage(m.chat, {
                text: `👢 *EXPULSAR USUARIO*\n\nSelecciona un usuario:\n\n${membersList}\n\n💡 Responde al mensaje con el número o menciona al usuario.\nEjemplo: \`${usedPrefix}kick @usuario\``,
                mentions: participants.map(p => p.id)
            }, { quoted: m })
            return
        }

        // Promover a admin
        if (subPanel === 'promover') {
            const nonAdmins = participants
                .filter(p => !p.admin && p.id !== conn.user.jid && p.id !== ownerGroup)
                .slice(0, 10)
                .map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`)
                .join('\n')

            await conn.sendMessage(m.chat, {
                text: `👑 *PROMOVER A ADMIN*\n\nSelecciona un usuario para promover:\n\n${nonAdmins}\n\n💡 Responde al mensaje con el número o menciona al usuario.\nEjemplo: \`${usedPrefix}promote @usuario\``,
                mentions: participants.map(p => p.id)
            }, { quoted: m })
            return
        }

        // Degradar admin
        if (subPanel === 'degradar') {
            const adminsList = admins
                .filter(p => p.id !== ownerGroup && p.id !== conn.user.jid)
                .slice(0, 10)
                .map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`)
                .join('\n')

            await conn.sendMessage(m.chat, {
                text: `📉 *DEGRADAR ADMIN*\n\nSelecciona un admin para degradar:\n\n${adminsList}\n\n💡 Responde al mensaje con el número o menciona al usuario.\nEjemplo: \`${usedPrefix}demote @usuario\``,
                mentions: admins.map(p => p.id)
            }, { quoted: m })
            return
        }

        // Kicknum
        if (subPanel === 'kicknum') {
            await m.reply(`🔢 *EXPULSAR POR PREFIJO*\n\nUsa el comando:\n\`\`\`${usedPrefix}kicknum 52\`\`\`\n💡 Reemplaza \`52\` por el prefijo del país.\n\n⚠️ Esto expulsará a TODOS los usuarios con ese prefijo.`)
            return
        }

        // Listnum
        if (subPanel === 'listnum') {
            await m.reply(`📋 *LISTAR POR PREFIJO*\n\nUsa el comando:\n\`\`\`${usedPrefix}listnum 52\`\`\`\n💡 Reemplaza \`52\` por el prefijo del país.\n\nℹ️ Mostrará todos los usuarios con ese prefijo.`)
            return
        }

        // Limpiar inactivos
        if (subPanel === 'limpiar') {
            const inactivosText = `🧹 *LIMPIAR INACTIVOS*\n\nEsta función permite eliminar usuarios inactivos del grupo basándose en diferentes criterios:\n\n1️⃣ *Sin mensajes en 30 días*\n2️⃣ *Números no verificados*\n3️⃣ *Usuarios silenciados*\n\n🔹 Usa: \`${usedPrefix}limpiar lista\` para ver los inactivos\n🔹 Usa: \`${usedPrefix}limpiar ejecutar\` para eliminarlos\n\n⚠️ *ADVERTENCIA:* Esta acción es irreversible.`
            await m.reply(inactivosText)
            return
        }

        // Estadísticas
        if (subPanel === 'stats') {
            const hora = moment.tz('America/Caracas').format('DD/MM/YYYY hh:mm:ss A')
            const statsText = `📊 *ESTADÍSTICAS DEL GRUPO*\n
🏷️ *Nombre:* ${groupInfo.subject}
👑 *Dueño:* @${ownerGroup.split('@')[0]}
👥 *Total miembros:* ${totalMembers}
⚡ *Total admins:* ${totalAdmins}
📅 *Creado:* ${new Date(groupInfo.creation * 1000).toLocaleDateString()}
🕐 *Hora actual:* ${hora}
🔢 *Prefijos comunes:*\n${getCommonPrefixes(participants)}`
            
            await conn.sendMessage(m.chat, {
                text: statsText,
                mentions: [ownerGroup]
            }, { quoted: m })
            return
        }

        // Si no se reconoce el subpanel
        await m.reply(`❓ Opción no reconocida. Usa:\n\n• ${usedPrefix}panel\n• ${usedPrefix}panel usuarios\n• ${usedPrefix}panel config\n• ${usedPrefix}panel herramientas`)

    } catch (error) {
        console.error('Error en panel:', error)
        m.reply(`⚠️ Error en el panel:\n${error.message}`)
    }
}

// Función para obtener prefijos comunes
function getCommonPrefixes(participants) {
    const prefixes = {}
    participants.forEach(p => {
        const num = p.id.split('@')[0]
        if (num.length >= 2) {
            const prefix = num.substring(0, 2)
            prefixes[prefix] = (prefixes[prefix] || 0) + 1
        }
    })
    
    const sorted = Object.entries(prefixes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([prefix, count]) => `• +${prefix}: ${count} usuarios`)
        .join('\n')
    
    return sorted || 'No hay datos suficientes'
}

// Configuración del handler
handler.help = ['panel', 'adminpanel']
handler.tags = ['group', 'admin']
handler.command = ['panel', 'adminpanel', 'controlpanel']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
