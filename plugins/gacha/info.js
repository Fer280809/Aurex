// plugins/gacha/gachainfo.js
import fs from 'fs';
import path from 'path';
import { formatCurrency } from '../../lib/gacha-config.js';

const handler = async (m, { conn }) => {
    const userId = m.sender;
    const usersPath = path.join(process.cwd(), 'lib', 'gacha_users.json');
    
    // Obtener economía principal
    const userEconomy = global.db.data.users[userId] || { coin: 0 };
    
    let gachaUsers = {};
    if (fs.existsSync(usersPath)) {
        gachaUsers = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    }
    
    if (!gachaUsers[userId]) {
        gachaUsers[userId] = {
            harem: [],
            favorites: [],
            claimMessage: '✧ {user} ha reclamado a {character}!',
            lastRoll: 0,
            votes: {},
            dailyLastClaim: 0,
            lastRob: 0
        };
    }
    
    const user = gachaUsers[userId];
    const userName = await conn.getName(userId);
    
    // Calcular estadísticas
    const totalValue = user.harem.reduce((sum, char) => sum + parseInt(char.value || 0), 0);
    const forSale = user.harem.filter(c => c.forSale).length;
    const stolen = user.harem.filter(c => c.stolen).length;
    const traded = user.harem.filter(c => c.traded).length;
    const bought = user.harem.filter(c => c.bought).length;
    
    // Tiempos
    const lastRoll = user.lastRoll ? `Hace ${Math.floor((Date.now() - user.lastRoll) / 60000)} min` : 'Nunca';
    const lastRob = user.lastRob ? `Hace ${Math.floor((Date.now() - user.lastRob) / 3600000)} h` : 'Nunca';
    
    const text = `
╭━━━━━━━━━━━━━━━━╮
│  📊 *${userName.toUpperCase()}* 📊
╰━━━━━━━━━━━━━━━━╯

┌─⊷ *ECONOMÍA*
│ 💰 *Monedas:* ${formatCurrency(userEconomy.coin)}
│ 🎲 *Costo por roll:* ¥150
│ 🏴‍☠️ *Costo por robo:* ¥500
└───────────────

┌─⊷ *COLECCIÓN*
│ 💖 *Personajes:* ${user.harem.length}
│ ⭐ *Favoritos:* ${user.favorites.length}
│ 🏪 *En venta:* ${forSale}
│ 💎 *Valor total:* ${formatCurrency(totalValue)}
└───────────────

┌─⊷ *ESTADÍSTICAS*
│ 🏴‍☠️ *Robados:* ${stolen}
│ 🔄 *Intercambiados:* ${traded}
│ 💰 *Comprados:* ${bought}
│ 🗳️ *Votos dados:* ${Object.keys(user.votes).length}
└───────────────

┌─⊷ *ACTIVIDAD*
│ 🎲 *Último roll:* ${lastRoll}
│ 🏴‍☠️ *Último robo:* ${lastRob}
│ 💬 *Claim msg:* ${user.claimMessage}
└───────────────`;

    m.reply(text);
};

handler.help = ['ginfo', 'infogacha', 'gachainfo'];
handler.tags = ['gacha'];
handler.command = ['ginfo', 'infogacha', 'gachainfo'];
handler.group = true;
export default handler;