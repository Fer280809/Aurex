let handler = async (m, { conn }) => {
  let mediaUrl = 'https://raw.githubusercontent.com/Fer280809/Asta_bot/main/lib/catalogo.jpg';
  let webUrl = 'https://study-bot.xo.je/';

  try {
    // Descargar imagen primero
    const axios = require('axios');
    let imageBuffer = await axios.get(mediaUrl, { 
      responseType: 'arraybuffer',
      timeout: 10000 
    }).then(res => Buffer.from(res.data, 'binary'));

    // Enviar como interactiveMessage
    await conn.sendMessage(m.chat, {
      image: imageBuffer,
      caption: '『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡',
      footer: 'Toca el botón de abajo 👇',
      buttons: [
        {
          buttonId: `link_${webUrl}`,
          buttonText: { displayText: '🌐 Este es mi página web' },
          type: 1,
          url: webUrl
        }
      ],
      headerType: 4,
      viewOnce: true
    }, { quoted: m });

  } catch (e) {
    console.error('Error:', e);
    m.reply('❌ Error al cargar la imagen');
  }
};

handler.help = ['web'];
handler.tags = ['main'];
handler.command = ['web', 'pagina', 'website'];

export default handler;
