let handler = async (m, { conn }) => {
  let mediaUrl = 'https://raw.githubusercontent.com/Fer280809/Asta_bot/main/lib/catalogo.jpg';
  let webUrl = 'https://study-bot.xo.je/';

  try {
    // Opción A: Con imagen como enlace
    await conn.sendMessage(m.chat, {
      image: { url: mediaUrl },
      caption: '『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡\n\n*Toca el botón de abajo para visitar mi página web*',
      templateButtons: [
        { urlButton: { displayText: '🌐 Visitar Sitio Web', url: webUrl } },
        { quickReplyButton: { displayText: '📞 Contacto', id: 'contacto' } }
      ]
    }, { quoted: m });

    // Opción B: Con texto y botones (sin imagen)
    // await conn.sendMessage(m.chat, {
    //   text: '『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡\n\n*Visita mi página web oficial:*',
    //   templateButtons: [
    //     { urlButton: { displayText: '🌐 Abrir Sitio Web', url: webUrl } }
    //   ]
    // }, { quoted: m });

  } catch (e) {
    console.error('Error:', e);
    m.reply('❌ Error al cargar el contenido');
  }
};

handler.help = ['web'];
handler.tags = ['main'];
handler.command = ['web', 'pagina', 'website'];
export default handler;