import moment from 'moment-timezone'

let handler = async (m, { conn, text, usedPrefix, command, participants }) => {
    // Verificar que sea grupo
    if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')
    
    // Verificar que el bot sea admin
    const botAdmin = participants.find(p => p.id === conn.user.jid)?.admin
    if (!['admin', 'superadmin'].includes(botAdmin)) {
        return m.reply('🤖 Necesito ser administrador para usar este panel')
    }
    
    // Verificar que el usuario sea admin
    const userAdmin = participants.find(p => p.id === m.sender)?.admin
    if (!['admin', 'superadmin'].includes(userAdmin) && !global.owner.map(v => v.replace(/\D/g, "") + "@s.whatsapp.net").includes(m.sender)) {
        return m.reply('⚠️ Solo administradores pueden usar este panel')
    }
    
    // Obtener información del grupo
    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return m.reply('❌ No pude obtener información del grupo')
    
    const owner = groupMetadata.owner || groupMetadata.participants.find(p => p.admin === 'superadmin')?.id
    const totalMembers = groupMetadata.participants.length
    const admins = groupMetadata.participants.filter(p => ['admin', 'superadmin'].includes(p.admin))
    const hora = moment.tz('America/Caracas').format('DD/MM/YYYY HH:mm:ss')
    
    // ==================== PANEL PRINCIPAL ====================
    if (!text) {
        const menu = `
╭━━━━━━━━━━━━━━━━━━╮
┃   🛠️ *PANEL DE ADMINISTRACIÓN* 🛠️
├━━━━━━━━━━━━━━━━━━┫
┃ 📊 *ESTADO DEL GRUPO*
┃ • 👥 Miembros: ${totalMembers}
┃ • 👑 Admins: ${admins.length}
┃ • 🕐 Hora: ${hora}
├━━━━━━━━━━━━━━━━━━┫
┃ 🔘 *OPCIONES DISPONIBLES:*
┃
┃ 1️⃣ *${usedPrefix}panel add 52123456789*
┃    ➤ Invitar a un usuario
┃
┃ 2️⃣ *${usedPrefix}panel kick @usuario*
┃    ➤ Expulsar a un usuario
┃
┃ 3️⃣ *${usedPrefix}panel promote @usuario*
┃    ➤ Promover a administrador
┃
┃ 4️⃣ *${usedPrefix}panel demote @usuario*
┃    ➤ Degradar de administrador
┃
┃ 5️⃣ *${usedPrefix}panel list*
┃    ➤ Ver lista de miembros
┃
┃ 6️⃣ *${usedPrefix}panel info*
┃    ➤ Información del grupo
╰━━━━━━━━━━━━━━━━━━╯

📝 *Ejemplos de uso:*
• ${usedPrefix}panel add 52123456789
• ${usedPrefix}panel kick @amigo
• ${usedPrefix}panel promote @amigo
• ${usedPrefix}panel demote @admin
        `.trim()
        
        return m.reply(menu)
    }
    
    // Separar comando y argumentos
    const args = text.trim().split(' ')
    const action = args[0].toLowerCase()
    const target = args.slice(1).join(' ')
    
    // ==================== FUNCIÓN AGREGAR USUARIO ====================
    if (action === 'add' || action === 'agregar' || action === 'invitar') {
        if (!target) return m.reply(`❌ Debes proporcionar un número\nEjemplo: ${usedPrefix}panel add 52123456789`)
        
        // Limpiar número
        let number = target.replace(/[^0-9]/g, '')
        if (number.length < 10) return m.reply('❌ Número inválido')
        
        // Generar link de invitación
        let link = 'https://chat.whatsapp.com/' + await conn.groupInviteCode(m.chat)
        
        // Crear mensaje de invitación
        const mensaje = `📨 *INVITACIÓN AL GRUPO*\n\n✨ Has sido invitado a unirte al grupo por @${m.sender.split('@')[0]}\n\n🔗 Enlace: ${link}\n\n⏰ Fecha: ${hora}`
        
        try {
            await conn.sendMessage(`${number}@s.whatsapp.net`, { 
                text: mensaje,
                mentions: [m.sender]
            })
            return m.reply(`✅ Invitación enviada exitosamente a +${number}`)
        } catch (error) {
            return m.reply(`❌ Error al enviar invitación: ${error.message}`)
        }
    }
    
    // ==================== FUNCIÓN EXPULSAR USUARIO ====================
    if (action === 'kick' || action === 'expulsar' || action === 'sacar') {
        // Obtener usuario mencionado o citado
        let user = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null)
        
        if (!user && target.startsWith('@')) {
            // Intentar extraer número de mención textual
            const num = target.replace('@', '').replace(/[^0-9]/g, '')
            if (num) user = `${num}@s.whatsapp.net`
        }
        
        if (!user) return m.reply(`❌ Debes mencionar o citar al usuario\nEjemplo: ${usedPrefix}panel kick @usuario`)
        
        // Validaciones
        if (user === conn.user.jid) return m.reply('❌ No puedo expulsarme a mí mismo')
        if (user === owner) return m.reply('❌ No puedo expulsar al dueño del grupo')
        if (global.owner.map(v => v.replace(/\D/g, "") + "@s.whatsapp.net").includes(user)) {
            return m.reply('❌ No puedo expulsar al dueño del bot')
        }
        
        try {
            await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
            return m.reply(`✅ Usuario @${user.split('@')[0]} expulsado exitosamente`, null, {
                mentions: [user]
            })
        } catch (error) {
            return m.reply(`❌ Error al expulsar: ${error.message}`)
        }
    }
    
    // ==================== FUNCIÓN PROMOVER ====================
    if (action === 'promote' || action === 'promover' || action === 'admin') {
        let user = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null)
        
        if (!user && target.startsWith('@')) {
            const num = target.replace('@', '').replace(/[^0-9]/g, '')
            if (num) user = `${num}@s.whatsapp.net`
        }
        
        if (!user) return m.reply(`❌ Debes mencionar o citar al usuario\nEjemplo: ${usedPrefix}panel promote @usuario`)
        
        // Verificar si ya es admin
        const userParticipant = groupMetadata.participants.find(p => p.id === user)
        if (userParticipant && ['admin', 'superadmin'].includes(userParticipant.admin)) {
            return m.reply('ℹ️ Este usuario ya es administrador')
        }
        
        try {
            await conn.groupParticipantsUpdate(m.chat, [user], 'promote')
            return m.reply(`✅ @${user.split('@')[0]} promovido a administrador`, null, {
                mentions: [user]
            })
        } catch (error) {
            return m.reply(`❌ Error al promover: ${error.message}`)
        }
    }
    
    // ==================== FUNCIÓN DEGRADAR ====================
    if (action === 'demote' || action === 'degradar' || action === 'quitaradmin') {
        let user = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null)
        
        if (!user && target.startsWith('@')) {
            const num = target.replace('@', '').replace(/[^0-9]/g, '')
            if (num) user = `${num}@s.whatsapp.net`
        }
        
        if (!user) return m.reply(`❌ Debes mencionar o citar al usuario\nEjemplo: ${usedPrefix}panel demote @admin`)
        
        // Validaciones
        if (user === conn.user.jid) return m.reply('❌ No puedo degradarme a mí mismo')
        if (user === owner) return m.reply('❌ No puedo degradar al dueño del grupo')
        
        try {
            await conn.groupParticipantsUpdate(m.chat, [user], 'demote')
            return m.reply(`✅ @${user.split('@')[0]} degradado de administrador`, null, {
                mentions: [user]
            })
        } catch (error) {
            return m.reply(`❌ Error al degradar: ${error.message}`)
        }
    }
    
    // ==================== FUNCIÓN LISTAR MIEMBROS ====================
    if (action === 'list' || action === 'lista' || action === 'miembros') {
        let page = parseInt(args[1]) || 1
        const perPage = 15
        const totalPages = Math.ceil(totalMembers / perPage)
        
        if (page < 1 || page > totalPages) {
            page = 1
        }
        
        const start = (page - 1) * perPage
        const end = start + perPage
        const pageMembers = groupMetadata.participants.slice(start, end)
        
        let listText = `📋 *LISTA DE MIEMBROS* (Página ${page}/${totalPages})\n`
        listText += `👥 Total: ${totalMembers} miembros\n\n`
        
        pageMembers.forEach((participant, index) => {
            const num = start + index + 1
            const role = participant.admin === 'superadmin' ? '👑 Dueño' : 
                        participant.admin === 'admin' ? '⚡ Admin' : '👤 Miembro'
            const mention = `@${participant.id.split('@')[0]}`
            listText += `${num}. ${mention} - ${role}\n`
        })
        
        listText += `\n📄 Usa: *${usedPrefix}panel list ${page + 1}* para ver más`
        
        const mentions = pageMembers.map(p => p.id)
        
        return conn.sendMessage(m.chat, {
            text: listText,
            mentions: mentions
        }, { quoted: m })
    }
    
    // ==================== FUNCIÓN INFORMACIÓN ====================
    if (action === 'info' || action === 'informacion' || action === 'estadisticas') {
        // Calcular prefijos comunes
        const prefixes = {}
        groupMetadata.participants.forEach(p => {
            if (p.id) {
                const num = p.id.split('@')[0]
                if (num.length >= 2) {
                    const prefix = num.substring(0, 2)
                    prefixes[prefix] = (prefixes[prefix] || 0) + 1
                }
            }
        })
        
        const topPrefixes = Object.entries(prefixes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([prefix, count]) => `• +${prefix}: ${count} usuarios`)
            .join('\n')
        
        const infoText = `
📊 *INFORMACIÓN DEL GRUPO*

🏷️ *Nombre:* ${groupMetadata.subject || 'Sin nombre'}
👑 *Dueño:* @${owner?.split('@')[0] || 'Desconocido'}
👥 *Total miembros:* ${totalMembers}
⚡ *Administradores:* ${admins.length}
📅 *Creado:* ${new Date(groupMetadata.creation * 1000).toLocaleDateString()}
🕐 *Hora actual:* ${hora}

📈 *Distribución por país:*
${topPrefixes || 'No hay datos suficientes'}

🔗 *Enlace de invitación:* ${'https://chat.whatsapp.com/' + await conn.groupInviteCode(m.chat)}
        `.trim()
        
        return conn.sendMessage(m.chat, {
            text: infoText,
            mentions: owner ? [owner] : []
        }, { quoted: m })
    }
    
    // ==================== FUNCIÓN KICKNUM (expulsar por prefijo) ====================
    if (action === 'kicknum' || action === 'expulsarprefijo') {
        if (!target) return m.reply(`❌ Debes proporcionar un prefijo\nEjemplo: ${usedPrefix}panel kicknum 52`)
        
        const prefix = target.replace(/[^0-9]/g, '')
        if (prefix.length < 2) return m.reply('❌ Prefijo inválido (mínimo 2 dígitos)')
        
        // Buscar usuarios con ese prefijo
        const usersToKick = groupMetadata.participants.filter(p => 
            p.id.startsWith(prefix) && 
            p.id !== conn.user.jid && 
            p.id !== owner &&
            !global.owner.map(v => v.replace(/\D/g, "") + "@s.whatsapp.net").includes(p.id)
        )
        
        if (usersToKick.length === 0) {
            return m.reply(`❌ No hay usuarios con el prefijo +${prefix}`)
        }
        
        // Confirmar acción
        const confirmation = await conn.sendMessage(m.chat, {
            text: `⚠️ *CONFIRMAR EXPULSIÓN*\n\n¿Estás seguro de expulsar a ${usersToKick.length} usuario(s) con prefijo +${prefix}?\n\nResponder con *SI* para confirmar o *NO* para cancelar.`
        }, { quoted: m })
        
        // Esperar respuesta
        const response = await new Promise((resolve) => {
            const listener = (msg) => {
                if (msg.sender === m.sender && msg.chat === m.chat) {
                    resolve(msg.text?.toLowerCase())
                }
            }
            conn.ev.on('messages.upsert', ({ messages }) => {
                messages.forEach(listener)
            })
            
            // Timeout de 30 segundos
            setTimeout(() => resolve(null), 30000)
        })
        
        if (response === 'si' || response === 'sí') {
            m.reply(`🚀 Expulsando ${usersToKick.length} usuario(s)...`)
            
            let success = 0
            let failed = 0
            
            for (const user of usersToKick) {
                try {
                    await conn.groupParticipantsUpdate(m.chat, [user.id], 'remove')
                    success++
                    await new Promise(resolve => setTimeout(resolve, 1000)) // Esperar 1 segundo entre expulsiones
                } catch {
                    failed++
                }
            }
            
            return m.reply(`✅ Resultado:\n• Expulsados: ${success}\n• Fallados: ${failed}`)
        } else {
            return m.reply('❌ Acción cancelada')
        }
    }
    
    // Si no se reconoce la acción
    return m.reply(`❌ Acción no reconocida\n\nUsa *${usedPrefix}panel* para ver las opciones disponibles`)
}

// Configuración del handler
handler.help = ['panel']
handler.tags = ['group', 'admin']
handler.command = ['panel', 'adminpanel', 'grouppanel']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
