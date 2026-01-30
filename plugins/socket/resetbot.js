import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const handler = async (m, { conn, usedPrefix, command }) => {
  try {
    // Verificar si es Fernando o dueño del bot
    const isFernando = global.fernando
      .map(v => v.replace(/\D/g, "") + "@s.whatsapp.net")
      .includes(m.sender)
    
    let isOwner = false
    if (conn.subConfig) {
      isOwner = conn.subConfig.owner === m.sender
    }
    
    if (!isFernando && !isOwner) {
      return m.reply('❌ Solo el dueño de este bot puede reiniciarlo.')
    }
    
    const botType = conn.user.jid === global.conn.user.jid ? 'PRINCIPAL' : 'SUB-BOT'
    const botName = conn.subConfig?.name || conn.user.name || 'Bot'
    
    await m.reply(`🔄 *Reiniciando ${botType}: ${botName}*\n\n⏳ Esto tomará unos segundos...`)
    
    if (conn.user.jid === global.conn.user.jid) {
      // Reiniciar bot principal
      console.log('🔄 Reiniciando bot principal por comando...')
      
      // Cerrar conexión actual
      if (conn.ws) {
        conn.ws.close()
      }
      
      // Reiniciar proceso
      setTimeout(() => {
        process.exit(0)
      }, 2000)
      
    } else {
      // Reiniciar SubBot individual
      const sessionId = conn.user.jid.split('@')[0]
      console.log(`🔄 Reiniciando SubBot: ${sessionId}`)
      
      // Cerrar conexión del SubBot
      if (conn.ws) {
        conn.ws.close()
      }
      
      // Remover de conns
      const index = global.conns.indexOf(conn)
      if (index > -1) {
        global.conns.splice(index, 1)
      }
      
      // Eliminar credenciales para forzar nuevo login
      const sessionPath = path.join(global.jadi, sessionId)
      const credsPath = path.join(sessionPath, 'creds.json')
      
      if (fs.existsSync(credsPath)) {
        fs.unlinkSync(credsPath)
        console.log(`🗑️ Credenciales eliminadas: ${sessionId}`)
      }
      
      await m.reply(`✅ *SubBot reiniciado*\n\n🔗 Vuelve a usar *${usedPrefix}qr* o *${usedPrefix}code* para reconectar.`)
    }
    
  } catch (error) {
    console.error('Error en resetbot:', error)
    m.reply('❌ Error al reiniciar el bot.')
  }
}

handler.help = ['resetbot']
handler.tags = ['subbot', 'main']
handler.command = ['resetbot', 'reiniciar', 'restart']
handler.premium = false
handler.group = false
handler.private = false

export default handler