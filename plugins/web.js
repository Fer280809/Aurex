import axios from 'axios';

let handler = async (m, { conn }) => {
  let webUrl = 'https://study-bot.xo.je/';
  let imageUrl = 'https://raw.githubusercontent.com/Fer280809/Asta_bot/main/lib/catalogo.jpg';

  try {
    // 1. Primero enviamos la imagen sola
    await conn.sendMessage(m.chat, {
      image: { url: imageUrl },
      caption: '『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡\n*Imagen cargada correctamente*'
    }, { quoted: m });

    // 2. Luego enviamos el mensaje con botones
    await conn.sendMessage(m.chat, {
      text: '🌐 *MI PÁGINA WEB*\n\nHaz clic en el botón para visitar mi sitio web oficial:',
      footer: 'Asta-Bot © 2024',
      templateButtons: [
        {
          index: 1,
          urlButton: {
            displayText: '🔗 VISITAR SITIO WEB',
            url: webUrl
          }
        },
        {
          index: 2,
          callButton: {
            displayText: '📞 CONTACTO',
            phoneNumber: '+1234567890' // Cambia por tu número
          }
        }
      ]
    }, { quoted: m });

  } catch (error) {
    console.error('Error:', error);
    
    // Fallback si falla
    await conn.sendMessage(m.chat, {
      text: `『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡\n\n🌐 *Mi página web:* ${webUrl}\n\n⚠️ *Nota:* Copia y pega este enlace en tu navegador.`,
      contextInfo: {
        externalAdReply: {
          title: 'Asta-Bot Web',
          body: 'Haz clic para visitar',
          thumbnailUrl: imageUrl,
          sourceUrl: webUrl,
          mediaType: 1
        }
      }
    }, { quoted: m });
  }
};

handler.help = ['web'];
handler.tags = ['main'];
handler.command = ['web', 'pagina', 'website'];
export default handler;