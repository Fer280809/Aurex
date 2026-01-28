let handler = async (m, { conn }) => {
  let mediaUrl = 'https://raw.githubusercontent.com/Fer280809/Asta_bot/main/lib/catalogo.jpg';
  let webUrl = 'https://study-bot.xo.je/';

  try {
    // Primero descargamos la imagen
    const axios = (await import('axios')).default;
    let response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    let imageBuffer = Buffer.from(response.data, 'binary');

    // Enviar mensaje con botones en el formato correcto
    await conn.sendMessage(m.chat, {
      image: imageBuffer,
      caption: '『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡\n\n*Visita mi página web oficial*',
      buttons: [
        {
          buttonId: `!link ${webUrl}`,
          buttonText: { displayText: '🌐 Abrir Sitio Web' },
          type: 1
        },
        {
          buttonId: `!menu`,
          buttonText: { displayText: '📱 Volver al Menú' },
          type: 1
        }
      ],
      headerType: 4
    }, { quoted: m });

    console.log('✅ Botón web enviado correctamente');

  } catch (e) {
    console.error('❌ Error en handler web:', e);
    
    // Fallback: enviar mensaje simple con el enlace
    await conn.sendMessage(m.chat, {
      text: `『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡\n\n🌐 *Mi página web:*\n${webUrl}\n\n_Copia y pega este enlace en tu navegador_`,
      contextInfo: {
        externalAdReply: {
          title: 'Asta-Bot Website',
          body: 'Haz clic aquí para visitar',
          thumbnailUrl: 'https://raw.githubusercontent.com/Fer280809/Asta_bot/main/lib/catalogo.jpg',
          sourceUrl: webUrl,
          mediaType: 1
        }
      }
    }, { quoted: m });
  }
};

handler.help = ['web', 'pagina', 'website'];
handler.tags = ['main'];
handler.command = /^(web|página|pagina|website|sitio)$/i;

// Si quieres que el botón del link funcione, necesitarás un handler adicional:
const linkHandler = async (m, { conn }) => {
  const url = m.text.split(' ')[1];
  
  if (url && url.startsWith('http')) {
    // Enviar mensaje con el enlace directo
    await conn.sendMessage(m.chat, {
      text: `🌐 *Enlace directo:*\n${url}\n\n_Puedes copiar este enlace o pedir al bot que te lo abra si está en un dispositivo móvil._`,
      templateButtons: [
        { urlButton: { displayText: '🔗 Abrir Enlace', url: url } }
      ]
    }, { quoted: m });
  }
};

linkHandler.help = ['link <url>'];
linkHandler.tags = ['util'];
linkHandler.command = /^link$/i;

// Exportar ambos handlers
export { handler as default, linkHandler };