
let handler = async (m, { conn, usedPrefix }) => {
  let totalreg = Object.keys(global.db.data.users).length;
  let totalCommands = Object.values(global.plugins).filter(v => v.help && v.tags).length;
  
  const botConfig = conn.subConfig || {}
  const botName = botConfig.name || global.botname
  const botIcon = botConfig.icon || global.icono
  const isSubBot = conn.user.jid !== global.conn.user.jid
  const botPrefix = botConfig.prefix || global.prefix

  let infoText = `╭─━━━━━━━━━━━━━━━─╮
│ 🎭 ¡Hola @${m.sender.split('@')[0]}! 💖
╰─━━━━━━━━━━━━━━━─╯

Me llamo *${botName}* ⚡

╭─═⊰ 📡 𝐄𝐒𝐓𝐀𝐃𝐎 𝐀𝐂𝐓𝐈𝐕𝐎
│ 🤖 Estado: ${isSubBot ? '🔗 SUB-BOT' : '🟢 PRINCIPAL'}
│ 🔧 Prefijo: ${botPrefix}
│ 👥 Users: ${totalreg.toLocaleString()}
│ 🛠️ Comandos: ${totalCommands}
│ 📅 Librería: Baileys MD
│ 🌍 Servidor: México 🇲🇽
│ 📡 Ping: ${Date.now() - m.timestamp}ms
│ 💾 Version: 1.3
│ 🔒 Modo: ${isSubBot ? (botConfig.mode === 'private' ? '🔐 PRIVADO' : '🔓 PÚBLICO') : '🔐 PRIVADO'}
╰───────────────╯

*Creador ғᴇʀɴᴀɴᴅᴏ 👑*
Selecciona una opción:`;

  // MISMOS BOTONES DE ANTES (como en tu versión original)
  let buttons = [
    { buttonId: usedPrefix + 'menu2', buttonText: { displayText: '📜 Menú' }, type: 1 },
    { buttonId: usedPrefix + 'nuevos', buttonText: { displayText: '📌 Actualizaciones' }, type: 1 },
    { buttonId: usedPrefix + 'code', buttonText: { displayText: '🤖 Sup-Bot' }, type: 1 },
    { buttonId: usedPrefix + 'creador', buttonText: { displayText: '👑 CREADOR' }, type: 1 },
    { buttonId: usedPrefix + 'menu+', buttonText: { displayText: '➕ Menu +18' }, type: 1 }
  ];

  // Solo para SubBots, agregar botones especiales
  if (isSubBot) {
    buttons = [
      { buttonId: usedPrefix + 'menu', buttonText: { displayText: '📜 Menú' }, type: 1 },
      { buttonId: usedPrefix + 'config', buttonText: { displayText: '⚙️ Config' }, type: 1 },
      { buttonId: usedPrefix + 'resetbot', buttonText: { displayText: '🔄 Reiniciar' }, type: 1 },
      { buttonId: usedPrefix + 'botlist', buttonText: { displayText: '📊 Bots' }, type: 1 },
      { buttonId: usedPrefix + 'code', buttonText: { displayText: '🤖 Nuevo Sub' }, type: 1 }
    ]
  }

  try {
    await conn.sendMessage(m.chat, {
      image: { url: botIcon },
      caption: infoText,
      footer: "『𝕬𝖘𝖙𝖆-𝕭𝖔𝖙』⚡",
      buttons: buttons,
      headerType: 4,
      mentions: [m.sender]
    }, { quoted: m });
  } catch (e) {
    console.error('Error al enviar imagen:', e);
    // Si falla, envía sin imagen
    let buttonMessage = {
      text: infoText,
      footer: "『𝕬𝖘𝖙𝖆-𝕭𝖔𝖙』⚡",
      buttons: buttons,
      headerType: 1,
      mentions: [m.sender]
    };
    await conn.sendMessage(m.chat, buttonMessage, { quoted: m });
  }
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menú', 'menu', 'help'];

export default handler;