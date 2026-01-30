let handler = async (m, { conn, usedPrefix }) => {
  let totalreg = Object.keys(global.db.data.users).length;
  let totalCommands = Object.values(global.plugins).filter(v => v.help && v.tags).length;
  
  // Obtener configuración del bot (principal o sub)
  const botConfig = conn.subConfig || {}
  const botName = botConfig.name || global.botname
  const botIcon = botConfig.icon || global.icono
  const isSubBot = conn.user.jid !== global.conn.user.jid
  
  let infoText = `╭─━━━━━━━━━━━━━━━─╮
│ 🎭 ¡Hola @${m.sender.split('@')[0]}! 💖
╰─━━━━━━━━━━━━━━━─╯

Me llamo *${botName}* ⚡

╭─═⊰ 📡 𝐄𝐒𝐓𝐀𝐃𝐎 𝐀𝐂𝐓𝐈𝐕𝐎
│ 🤖 Estado: ${isSubBot ? '🔗 SUB-BOT' : '🟢 PRINCIPAL'}
│ 👥 Users: ${totalreg.toLocaleString()}
│ 🛠️ Comandos: ${totalCommands}
│ 📅 Librería: Baileys MD
│ 🌍 Servidor: México 🇲🇽
│ 📡 Ping: ${Date.now() - m.timestamp}ms
│ 💾 Version: 1.3
│ 🔒 Modo: ${isSubBot ? '🔓 PÚBLICO' : '🔐 PRIVADO'}
╰───────────────╯

*Creador ғᴇʀɴᴀɴᴅᴏ 👑*
Selecciona una opción:`;

  let buttons = [
    { buttonId: usedPrefix + 'menu', buttonText: { displayText: '📜 Menú' }, type: 1 },
    { buttonId: usedPrefix + 'nuevos', buttonText: { displayText: '📌 Actualizaciones' }, type: 1 },
    { buttonId: usedPrefix + 'code', buttonText: { displayText: '🤖 Sup-Bot' }, type: 1 },
    { buttonId: usedPrefix + 'creador', buttonText: { displayText: '👑 CREADOR' }, type: 1 }
  ];

  try {
    await conn.sendMessage(m.chat, {
      image: { url: botIcon },
      caption: infoText,
      footer: botName,
      buttons: buttons,
      mentions: [m.sender]
    }, { quoted: m });
  } catch (e) {
    console.error('Error:', e)
    await conn.sendMessage(m.chat, {
      text: infoText,
      buttons: buttons,
      mentions: [m.sender]
    }, { quoted: m })
  }
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menú', 'menu', 'help'];
export default handler;