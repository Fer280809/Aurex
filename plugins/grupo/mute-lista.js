const handler = async (m, { isOwner, isAdmin, conn, participants, args, command }) => {
  if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')

  try {
    // Verificar si hay mutes en este grupo
    const mutes = global.db.data?.chats?.[m.chat]?.mutes
    if (!mutes || Object.keys(mutes).length === 0) {
      return m.reply('📭 No hay usuarios silenciados en este grupo')
    }

    let teks = `*📋 USUARIOS SILENCIADOS*\n\n`
    let count = 0
    const now = Date.now()

    for (const [jid, data] of Object.entries(mutes)) {
      count++
      
      // Verificar si el mute ha expirado
      if (data.expiresAt && data.expiresAt <= now) {
        delete mutes[jid]
        continue
      }

      const userName = data.name || jid.split('@')[0]
      const adminName = data.adminName || 'Desconocido'
      const mutedAt = new Date(data.mutedAt).toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        hour12: true
      })
      
      teks += `*${count}.* @${jid.split('@')[0]}\n`
      teks += `   ◦ *Silenciado por:* @${data.mutedBy.split('@')[0]}\n`
      teks += `   ◦ *Fecha:* ${mutedAt}\n`
      
      if (data.expiresAt) {
        const remaining = data.expiresAt - now
        if (remaining > 0) {
          teks += `   ◦ *Expira en:* ${formatTime(remaining)}\n`
        } else {
          teks += `   ◦ *Expirado*\n`
        }
      } else {
        teks += `   ◦ *Duración:* Indefinida\n`
      }
      teks += `\n`
    }

    // Actualizar si se eliminaron mutes expirados
    if (count !== Object.keys(mutes).length) {
      // Puedes guardar los cambios si es necesario
    }

    if (count === 0) {
      return m.reply('📭 No hay usuarios silenciados activos en este grupo')
    }

    teks += `\n📊 *Total:* ${count} usuario${count !== 1 ? 's' : ''} silenciado${count !== 1 ? 's' : ''}`

    // Obtener menciones
    const mentions = Object.keys(mutes).map(jid => jid)

    conn.sendMessage(m.chat, { 
      text: teks, 
      mentions: mentions 
    })

  } catch (error) {
    console.error('Error en listmute:', error)
    m.reply(`❌ Ocurrió un error: ${error.message}`)
  }
}

// Función para formatear tiempo (misma que en mute.js)
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

handler.help = ['listmute', 'mutelist', 'listasilenciados']
handler.tags = ['group']
handler.command = ['listmute', 'mutelist', 'silenciados']
handler.admin = true
handler.group = true

export default handler