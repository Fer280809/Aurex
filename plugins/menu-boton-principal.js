import { getSubBotLogo } from './configsub.js' // Importar función para obtener logo

let handler = async (m, { conn, usedPrefix, command }) => {
  let totalreg = Object.keys(global.db.data.users).length;
  let totalCommands = Object.values(global.plugins).filter(v => v.help && v.tags).length;

  const botConfig = conn.subConfig || {}
  const isSubBot = conn.user.jid !== global.conn.user.jid
  
  // Obtener nombre dinámico
  const botName = botConfig.name || 
                 (isSubBot ? `SubBot ${conn.user.jid.split('@')[0].slice(-4)}` : global.botname)
  
  // Obtener prefijo dinámico
  const botPrefix = botConfig.prefix || global.prefix
  
  // Obtener modo dinámico
  const botMode = isSubBot ? (botConfig.mode || 'public') : 'private'

  // Obtener logo del SubBot o global
  let botIcon
  try {
    if (isSubBot) {
      // Usar la función importada para obtener logo del SubBot
      botIcon = await getSubBotLogo(conn)
      if (!botIcon || botIcon.length < 100) {
        // Si no hay logo válido, usar el global
        botIcon = { url: global.icono }
      }
    } else {
      botIcon = { url: global.icono }
    }
  } catch (e) {
    console.error('Error obteniendo logo:', e)
    botIcon = { url: global.icono }
  }

  // Texto informativo dinámico
  let infoText = `╭─━━━━━━━━━━━━━━━─╮
│ 🎭 ¡Hola @${m.sender.split('@')[0]}! 💖
╰─━━━━━━━━━━━━━━━─╯

*${botName}* ⚡ ${isSubBot ? '(SubBot)' : '(Bot Principal)'}

╭─═⊰ 📡 𝐄𝐒𝐓𝐀𝐃𝐎 𝐀𝐂𝐓𝐈𝐕𝐎
│ 🤖 Estado: ${isSubBot ? '🔗 SUB-BOT' : '🟢 PRINCIPAL'}
│ 🔧 Prefijo: ${botPrefix}
│ 👥 Usuarios: ${totalreg.toLocaleString()}
│ 🛠️ Comandos: ${totalCommands}
│ 📅 Librería: Baileys MD
│ 🌍 Servidor: México 🇲🇽
│ 📡 Ping: ${Date.now() - m.timestamp}ms
│ 💾 Version: ${global.vs}
│ 🔒 Modo: ${botMode === 'private' ? '🔐 PRIVADO' : '🔓 PÚBLICO'}
╰───────────────╯

*Creador ғᴇʀɴᴀɴᴅᴏ 👑*
Selecciona una opción:`;

  // Botones dinámicos según el tipo de bot
  let buttons
  
  if (isSubBot) {
    // BOTONES PARA SUBBOT
    buttons = [
      { buttonId: `${usedPrefix}menu`, buttonText: { displayText: '📜 Menú Completo' }, type: 1 },
      { buttonId: `${usedPrefix}config`, buttonText: { displayText: '⚙️ Configurar' }, type: 1 },
      { buttonId: `${usedPrefix}resetbot`, buttonText: { displayText: '🔄 Reiniciar' }, type: 1 },
      { buttonId: `${usedPrefix}botlist`, buttonText: { displayText: '📊 Mis Bots' }, type: 1 },
      { buttonId: `${usedPrefix}serbot`, buttonText: { displayText: '🤖 Nuevo Bot' }, type: 1 }
    ]
  } else {
    // BOTONES PARA BOT PRINCIPAL
    buttons = [
      { buttonId: `${usedPrefix}menu2`, buttonText: { displayText: '📜 Menú' }, type: 1 },
      { buttonId: `${usedPrefix}nuevos`, buttonText: { displayText: '📌 Actualizaciones' }, type: 1 },
      { buttonId: `${usedPrefix}serbot`, buttonText: { displayText: '🤖 Sup-Bot' }, type: 1 },
      { buttonId: `${usedPrefix}creador`, buttonText: { displayText: '👑 CREADOR' }, type: 1 },
      { buttonId: `${usedPrefix}menu+`, buttonText: { displayText: '➕ Menu +18' }, type: 1 }
    ]
  }

  try {
    // Enviar mensaje con imagen dinámica
    await conn.sendMessage(m.chat, {
      image: botIcon,
      caption: infoText,
      footer: `『${botName}』⚡ • v${global.vs}`,
      buttons: buttons,
      headerType: 4,
      mentions: [m.sender]
    }, { quoted: m });
    
  } catch (e) {
    console.error('Error al enviar menú:', e);
    
    // Fallback: enviar sin imagen
    let fallbackMessage = {
      text: infoText,
      footer: `『${botName}』⚡ • v${global.vs}`,
      buttons: buttons,
      headerType: 1,
      mentions: [m.sender]
    };
    
    await conn.sendMessage(m.chat, fallbackMessage, { quoted: m });
  }
};

// Comandos para forzar actualización del menú
handler.help = ['menu', 'menú', 'help', 'actualizarmenu'];
handler.tags = ['main'];
handler.command = ['menu', 'menú', 'help', 'actualizarmenu'];

export default handler;