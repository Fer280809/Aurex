// plugins/gacha/waifusboard.js
import fs from 'fs';
import path from 'path';

const handler = async (m, { conn, args }) => {
    const dbPath = path.join(process.cwd(), 'lib', 'characters.json');
    
    if (!fs.existsSync(dbPath)) {
        return m.reply('🏆 *No hay personajes disponibles.*');
    }
    
    const characters = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    
    // Filtrar y ordenar por valor
    const sortedChars = characters
        .filter(c => c.value && !isNaN(c.value))
        .sort((a, b) => parseInt(b.value) - parseInt(a.value));
    
    const limit = parseInt(args[0]) || 20;
    const topChars = sortedChars.slice(0, Math.min(limit, 50));
    
    if (topChars.length === 0) {
        return m.reply('🏆 *No hay personajes con valor registrado.*');
    }
    
    let text = `
╭━━━━━━━━━━━━━━━━╮
│  🏆 *TOP ${topChars.length}* 🏆
╰━━━━━━━━━━━━━━━━╯

📊 *Ordenados por valor*

`;
    
    topChars.forEach((char, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        const rarity = char.value > 5000 ? '🌟' : char.value > 2000 ? '💎' : char.value > 800 ? '🔷' : '🔹';
        
        text += `
${medal} ${rarity} *${char.name}*
   📺 ${char.source}
   💎 Valor: ${char.value}
   🗳️ Votos: ${char.votes || 0}
`;
    });
    
    text += `\n📌 *Usa /top <número> para ver más*`;
    
    m.reply(text);
};

handler.help = ['top', 'ranking', 'waifutop'];
handler.tags = ['gacha'];
handler.command = ['top', 'ranking', 'waifutop'];
handler.group = true;
export default handler;