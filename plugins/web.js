// Guarda la imagen en tu proyecto como `media/catalogo.jpg`
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let handler = async (m, { conn }) => {
  let webUrl = 'https://study-bot.xo.je/';
  
  try {
    // Leer imagen local
    const imagePath = join(__dirname, '../media/catalogo.jpg');
    const imageBuffer = readFileSync(imagePath);
    
    await conn.sendMessage(m.chat, {
      image: imageBuffer,
      caption: '『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡\n\nVisita mi web: ' + webUrl,
      templateButtons: [{
        urlButton: {
          displayText: '🌐 Abrir Sitio Web',
          url: webUrl
        }
      }]
    }, { quoted: m });
    
  } catch (e) {
    console.error(e);
    m.reply(`🌐 Mi web: ${webUrl}`);
  }
};

handler.help = ['web'];
handler.tags = ['main'];
handler.command = ['web', 'pagina'];
export default handler;