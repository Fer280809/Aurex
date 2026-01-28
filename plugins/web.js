let handler = async (m, { conn }) => {
  let mediaUrl = 'https://raw.githubusercontent.com/Fer280809/Asta_bot/main/lib/catalogo.jpg';
  let webUrl = 'https://study-bot.xo.je/';

  try {
    // Enviar imagen con botón URL usando templateMessage
    await conn.relayMessage(m.chat, {
      templateMessage: {
        hydratedTemplate: {
          imageMessage: {
            url: mediaUrl,
            caption: '『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡\n\n👇 Toca el botón para visitar:',
            jpegThumbnail: null
          },
          hydratedFooterText: "Powered by Asta-Bot",
          hydratedButtons: [
            {
              urlButton: {
                displayText: '🌐 Este es mi página web',
                url: webUrl
              }
            }
          ]
        }
      }
    }, { quoted: m });

  } catch (e) {
    console.error('Error:', e);
    
    // Fallback: enviar imagen normal con link en caption
    await conn.sendMessage(m.chat, {
      image: { url: mediaUrl },
      caption: `『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡\n\n🌐 Mi página web:\n${webUrl}`
    }, { quoted: m });
  }
};

handler.help = ['web'];
handler.tags = ['main'];
handler.command = ['web', 'pagina', 'website'];

export default handler;
