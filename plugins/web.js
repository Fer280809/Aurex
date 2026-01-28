let handler = async (m, { conn }) => {
  let mediaUrl = 'https://raw.githubusercontent.com/Fer280809/Asta_bot/main/lib/catalogo.jpg';
  let webUrl = 'https://study-bot.xo.je/';

  try {
    await conn.sendMessage(m.chat, {
      image: { url: mediaUrl },
      caption: '『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡\n\nToca el botón para visitar mi web:',
      footer: "Powered by Asta-Bot",
      templateButtons: [
        {
          index: 1,
          urlButton: {
            displayText: '🌐 Este es mi página web',
            url: webUrl
          }
        }
      ]
    }, { quoted: m });

  } catch (e) {
    console.error('Error:', e);
    m.reply('Error al enviar el mensaje');
  }
};

handler.help = ['web'];
handler.tags = ['main'];
handler.command = ['web', 'pagina', 'website'];

export default handler;
