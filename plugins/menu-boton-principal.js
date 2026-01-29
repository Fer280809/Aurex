let handler = async (m, { conn, usedPrefix }) => {
  let totalreg = Object.keys(global.db.data.users).length;
  let totalCommands = Object.values(global.plugins).filter(
    (v) => v.help && v.tags
  ).length;
  let libreria = 'Baileys';
  let vs = '1.3';
  let userId = m.sender;
  
  // Obtener configuración del sub-bot
  const isMainBot = conn.user.jid === global.conn.user.jid;
  const botConfig = getSubBotConfig(conn.user.jid);
  
  // Usar nombre personalizado o por defecto
  let botName = botConfig.name || '𝕬𝖘𝖙𝖆-𝕭𝖔𝖙';
  let botLogo = botConfig.logo || 'https://raw.githubusercontent.com/Fer280809/Asta_bot/main/lib/catalogo.jpg';
  let botStatus = botConfig.customStatus || 'Disponible ⚡';
  
  let infoText = `╭─━━━━━━━━━━━━━━━─╮
│ 🎭 ¡Hola @${userId.split('@')[0]}! 💖
╰─━━━━━━━━━━━━━━━─╯

Me llamo『 ${botName} 』⚡
${isMainBot ? '' : `(Sub-Bot de ${global.botname})`}

╭─═⊰ 📡 𝐄𝐒𝐓𝐀𝐃𝐎 𝐀𝐂𝐓𝐈𝐕𝐎
│ 🤖 Estado: ${botStatus}
│ 📊 Tipo: ${isMainBot ? '🟢 BOT PRINCIPAL' : '🔗 SUB-BOT'}
│ 👥 Usuarios: 『${totalreg.toLocaleString()}』🔥
│ 🛠️ Comandos: 『${totalCommands}』⚙️
│ 📅 Librería » ${libreria}
│ 🌍 Servidor: México 🇲🇽
│ 📡 Ping: ${Date.now() - m.timestamp}ms
│ 💾 Versión: ${vs}
│ 🔧 Prefijo: ${botConfig.prefix ? botConfig.prefix.toString() : global.prefix}
╰───────────────╯

${isMainBot ? '*Creador 𝕱𝖊𝖗𝖓𝖆𝖓𝖉𝖔 👑*' : '*Personalizado por Usuario*'}
Selecciona una opción:`;

  let buttons = [
    { buttonId: usedPrefix + 'menu2', buttonText: { displayText: '📜 Menú' }, type: 1 },
    { buttonId: usedPrefix + 'nuevos', buttonText: { displayText: '📌 Actualizaciones' }, type: 1 },
    { buttonId: usedPrefix + 'code', buttonText: { displayText: '🤖 Sup-Bot' }, type: 1 },
    { buttonId: usedPrefix + 'creador', buttonText: { displayText: '👑 CREADOR' }, type: 1 },
    { buttonId: usedPrefix + 'menu+', buttonText: { displayText: '➕ Menu +18' }, type: 1 }
  ];

  // Agregar botones de configuración si es socket admin
  const isSocketAdmin = conn.user.jid !== global.conn.user.jid || 
                       global.fernando.map(v => v.replace(/\D/g, "") + "@s.whatsapp.net").includes(userId);
  
  if (isSocketAdmin && !isMainBot) {
    buttons.push(
      { buttonId: usedPrefix + 'config', buttonText: { displayText: '⚙️ Config' }, type: 1 }
    );
  }

  try {
    await conn.sendMessage(m.chat, {
      image: { url: botLogo },
      caption: infoText,
      footer: `『${botName}』⚡ ${isMainBot ? '' : '| Sub-Bot'}`,
      buttons: buttons,
      headerType: 4,
      mentions: [userId]
    }, { quoted: m });
  } catch (e) {
    console.error('Error al enviar imagen:', e);
    let buttonMessage = {
      text: infoText,
      footer: `『${botName}』⚡ ${isMainBot ? '' : '| Sub-Bot'}`,
      buttons: buttons,
      headerType: 1,
      mentions: [userId]
    };
    await conn.sendMessage(m.chat, buttonMessage, { quoted: m });
  }
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menú', 'menu', 'help', 'start'];
handler.fail = null;

export default handler;