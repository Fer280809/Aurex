let handler = async (m, { conn }) => {
  let webUrl = 'https://study-bot.xo.je/';
  
  try {
    // Enviar mensaje con botón de URL directa (WhatsApp lo maneja automáticamente)
    await conn.sendMessage(m.chat, {
      text: '『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡\n\n*Haz clic en el botón para visitar mi página web:*',
      templateButtons: [
        {
          index: 1,
          urlButton: {
            displayText: '🌐 Visitar Sitio Web',
            url: webUrl
          }
        },
        {
          index: 2,
          quickReplyButton: {
            displayText: '📱 Más información',
            id: 'info'
          }
        }
      ]
    }, { quoted: m });

  } catch (e) {
    console.error('Error:', e);
    // Fallback simple
    await m.reply(`『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡\n\n🌐 *Mi página web:* ${webUrl}`);
  }
};

handler.help = ['web'];
handler.tags = ['main'];
handler.command = ['web', 'pagina', 'website'];

// Handler para el botón rápido de información
const quickReplyHandler = async (m, { conn }) => {
  if (m.message?.buttonsResponseMessage?.selectedButtonId === 'info') {
    await m.reply('*Información del Bot:*\n\nSoy Asta-Bot, un bot multifunción creado para ayudarte. Visita mi web para ver todas mis funciones.');
  }
};

export { handler as default, quickReplyHandler };