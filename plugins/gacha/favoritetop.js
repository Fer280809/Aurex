// plugins/gacha/favoritetop.js
import fs from 'fs';
import path from 'path';

const handler = async (m, { conn }) => {
    const usersPath = path.join(process.cwd(), 'lib', 'gacha_users.json');
    const dbPath = path.join(process.cwd(), 'lib', 'characters.json');
    
    if (!fs.existsSync(usersPath) || !fs.existsSync(dbPath)) {
        return m.reply('📊 *No hay datos disponibles.*');
    }
    
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    const characters = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    
    // Contar favoritos por personaje
    const favCounts = {};
    
    for (const userData of Object.values(users)) {
        if (userData.favorites) {
            userData.favorites.forEach(charId => {
                favCounts[charId] = (favCounts[charId] || 0) + 1;
            });
        }
    }
    
    // Obtener info de personajes
    const favChars = [];
    for (const [charId, count] of Object.entries(favCounts)) {
        const char = characters.find(c => c.id === charId);
        if (char) {
            favChars.push({
                ...char,
                favCount: count
            });
        }
    }
    
    favChars.sort((a, b) => b.favCount - a.favCount);
    const topFavs = favChars.slice(0, 15);
    
    if (topFavs.length === 0) {
        return m.reply('📭 *No hay favoritos aún.*');
    }
    
    let text = `
╭━━━━━━━━━━━━━━━━╮
│  ⭐ *TOP FAVORITOS* ⭐
╰━━━━━━━━━━━━━━━━╯

`;
    
    topFavs.forEach((char, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        text += `
${medal} *${char.name}*
   📺 ${char.source}
   ⭐ Favoritos: ${char.favCount}
   💎 Valor: ${char.value}
`;
    });
    
    m.reply(text);
};

handler.help = ['topfav', 'favoritestop'];
handler.tags = ['gacha'];
handler.command = ['topfav', 'favoritestop'];
handler.group = true;
export default handler;