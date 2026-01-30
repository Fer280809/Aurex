// plugins/gacha/sell.js
import fs from 'fs';
import path from 'path';
import { GACHA_CONFIG, formatCurrency } from '../../lib/gacha-config.js';

const handler = async (m, { conn, text }) => {
    const args = text.split(',').map(arg => arg.trim());
    
    if (args.length < 2) {
        return m.reply('❌ *Uso:* /sell <precio>, <nombre>\nEjemplo: /sell 500, Miku');
    }
    
    const price = parseInt(args[0]);
    const charName = args.slice(1).join(',').trim();
    
    if (isNaN(price) || price < GACHA_CONFIG.limits.minSale) {
        return m.reply(`❌ *Precio inválido.* Mínimo: *${formatCurrency(GACHA_CONFIG.limits.minSale)}*`);
    }
    
    if (price > GACHA_CONFIG.limits.maxSale) {
        return m.reply(`❌ *Precio muy alto.* Máximo: *${formatCurrency(GACHA_CONFIG.limits.maxSale)}*`);
    }
    
    const userId = m.sender;
    const usersPath = path.join(process.cwd(), 'lib', 'gacha_users.json');
    
    let users = {};
    if (fs.existsSync(usersPath)) {
        users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    }
    
    if (!users[userId] || !users[userId].harem || users[userId].harem.length === 0) {
        return m.reply('❌ *No tienes personajes para vender.*');
    }
    
    const charIndex = users[userId].harem.findIndex(c => 
        c.name.toLowerCase().includes(charName.toLowerCase())
    );
    
    if (charIndex === -1) {
        return m.reply('❌ *No tienes ese personaje en tu harem.*');
    }
    
    // No vender personajes robados recientemente
    if (users[userId].harem[charIndex].stolen && 
        (Date.now() - users[userId].harem[charIndex].claimedAt) < 86400000) {
        return m.reply('❌ *No puedes vender un personaje robado en las últimas 24 horas.*');
    }
    
    // Poner en venta
    users[userId].harem[charIndex].forSale = true;
    users[userId].harem[charIndex].salePrice = price;
    users[userId].harem[charIndex].listedAt = Date.now();
    
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf-8');
    
    m.reply(`✅ *${users[userId].harem[charIndex].name}* ahora está en venta por *${formatCurrency(price)}*\n📌 Usa /removesale <nombre> para quitar de la venta.`);
};

handler.help = ['sell', 'vender'];
handler.tags = ['gacha'];
handler.command = ['sell', 'vender'];
handler.group = true;
export default handler;