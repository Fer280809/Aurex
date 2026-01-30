// plugins/gacha/harem.js
import fs from 'fs';
import path from 'path';
import { formatCurrency } from '../../lib/gacha-config.js';

const handler = async (m, { conn, args }) => {
    const usersPath = path.join(process.cwd(), 'lib', 'gacha_users.json');
    
    // Determinar usuario
    let targetUser = m.sender;
    if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetUser = m.mentionedJid[0];
    } else if (args[0] && args[0].startsWith('@')) {
        const num = args[0].replace('@', '');
        targetUser = num + '@s.whatsapp.net';
    }
    
    let users = {};
    if (fs.existsSync(usersPath)) {
        users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    }
    
    if (!users[targetUser] || !users[targetUser].harem || users[targetUser].harem.length === 0) {
        return m.reply('📭 *Este usuario no tiene personajes.*');
    }
    
    const userName = await conn.getName(targetUser);
    const page = parseInt(args[1]) || 1;
    const perPage = 10;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const totalPages = Math.ceil(users[targetUser].harem.length / perPage);
    
    let text = `
╭━━━━━━━━━━━━━━━━╮
│  💖 *HAREM DE ${userName.toUpperCase()}* 💖
╰━━━━━━━━━━━━━━━━╯

📊 *Total:* ${users[targetUser].harem.length}
💰 *Saldo:* ${formatCurrency(global.db.data.users[targetUser]?.coin || 0)}
📄 *Página ${page}/${totalPages}*

`;
    
    users[targetUser].harem.slice(start, end).forEach((char, i) => {
        const isFav = users[targetUser].favorites.includes(char.id);
        const forSale = char.forSale ? `🏪 En venta: ${formatCurrency(char.salePrice)}` : '';
        const stolen = char.stolen ? '🏴‍☠️ ' : '';
        const traded = char.traded ? '🔄 ' : '';
        const bought = char.bought ? '💰 ' : '';
        
        text += `
${start + i + 1}. ${stolen}${traded}${bought}*${char.name}* ${isFav ? '⭐' : ''}
   📺 ${char.source}
   💎 Valor: ${char.value}
${forSale ? `   ${forSale}` : ''}
`;
    });
    
    if (totalPages > 1) {
        text += `\n📌 *Usa /harem @usuario <página>*`;
    }
    
    m.reply(text);
};

handler.help = ['harem', 'miswaifus', 'coleccion'];
handler.tags = ['gacha'];
handler.command = ['harem', 'miswaifus', 'coleccion'];
handler.group = true;
export default handler;