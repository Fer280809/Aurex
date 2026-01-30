let handler = async (m, { conn, usedPrefix }) => {
  let totalreg = Object.keys(global.db.data.users).length
  let totalCommands = Object.values(global.plugins).filter(v => v.help && v.tags).length
  let userId = m.sender
  
  // Obtener configuración personalizada
  const isMainBot = conn.user.jid === global.conn.user.jid
  const config = global.getSubBotConfig(conn.user.jid)
  
  // Usar valores personalizados o globales
  let botName = config.name
  let botLogo = config.logo
  let botStatus = config.customStatus
  
  let infoText = `╭─━━━━━━━━━━━━━━━─╮
│ 🎭 ¡Hola @${userId.split('@')[0]}! 💖
╰─━━━━━━━━━━━━━━━─╯

Me llamo『 ${botName} 』⚡
${isMainBot ? '' : '(Sub-Bot Personalizado)'}

╭─═⊰ 📡 𝐄𝐒𝐓𝐀𝐃𝐎
│ 🤖 Estado: ${botStatus}
│ 📊 Tipo: ${isMainBot ? '🟢 Principal' : '🔗 Sub-Bot'}
│ 👥 Users: ${totalreg.toLocaleString()}
│ 🛠️ Comandos: ${totalCommands}
│ 🔣 Prefijos: ${config.prefix.join(' ')}
│ 🔓 Sin prefijo: ${config.sinprefix ? '✅' : '❌'}
╰───────────────╯

${isMainBot ? 'Creador Fernando 👑' : 'Configuración Personal'}
Selecciona:`

  let buttons = [
    { buttonId: usedPrefix + 'menu2', buttonText: { displayText: '📜 Menú' }, type: 1 },
    { buttonId: usedPrefix + 'nuevos', buttonText: { displayText: '📌 Updates' }, type: 1 },
    { buttonId: usedPrefix + 'code', buttonText: { displayText: '🤖 Sub-Bot' }, type: 1 }
  ]

  // Agregar botón de configuración si es sub-bot o Fernando
  const isFernandoMember = global.fernando.map(v => v.replace(/\D/g, "") + "@s.whatsapp.net").includes(userId)
  if (!isMainBot || isFernandoMember) {
    buttons.push({ buttonId: usedPrefix + 'config', buttonText: { displayText: '⚙️ Config' }, type: 1 })
  }

  try {
    await conn.sendMessage(m.chat, {
      image: { url: botLogo },
      caption: infoText,
      footer: botName,
      buttons: buttons,
      headerType: 4,
      mentions: [userId]
    }, { quoted: m })
  } catch (e) {
    await conn.sendMessage(m.chat, {
      text: infoText,
      footer: botName,
      buttons: buttons,
      headerType: 1,
      mentions: [userId]
    }, { quoted: m })
  }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menú', 'menu']

export default handler