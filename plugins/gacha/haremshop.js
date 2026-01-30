// plugins/gacha/haremshop.js
import fs from 'fs';
import path from 'path';
import { formatCurrency } from '../../lib/gacha-config.js';

const handler = async (m, { conn, args }) => {
    const usersPath = path.join(process.cwd(), 'lib', 'gacha_users.json');
    
    let users = {};
    if (fs.existsSync(usersPath)) {
        users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    }
    
    // Obtener personajes en venta
    let forSale = [];
    for (const [userId, userData] of Object.entries(users)) {
        if (userData.harem) {
            userData.harem.forEach(char => {
                if (char.forSale) {
                    forSale.push({
                        ...char,
                        ownerId: userId,
                        ownerName: userId.split('@')[0]
                    });
                }
            });
        }
    }
    
    if (forSale.length === 0) {
        return m.reply('🏪 *No hay personajes en venta.*');
    }
    
    // Ordenar por precio
    forSale.sort((a, b) => a.salePrice - b.salePrice);
    
    const page = parseInt(args[0]) || 1;
    const perPage = 10;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const totalPages = Math.ceil(forSale.length / perPage);
    
    let text = `
╭━━━━━━━━━━━━━━━━╮
│  🏪 *TIENDA* 🏪
╰━━━━━━━━━━━━━━━━╯

📊 *Total en venta:* ${forSale.length}
📄 *Página ${page}/${totalPages}*

`;
    
    for (let i = start; i < end && i < forSale.length; i++) {
        const char = forSale[i];
        const ownerName = await conn.getName(char.ownerId);
        const rarity = char.value > 5000 ? '🌟' : char.value > 2000 ? '💎' : char.value > 800 ? '🔷' : '🔹';
        
        text += `
${i + 1}. ${rarity} *${char.name}*
   📺 ${char.source}
   💎 Valor: ${char.value}
   💰 Precio: ${formatCurrency(char.salePrice)}
   👤 Vendedor: ${ownerName}
`;
    }
    
    text += `\n💡 *Usa /buy <nombre> para comprar*\n📌 *Página siguiente: /tienda ${page + 1}*`;
    
    m.reply(text);
};

handler.help = ['tienda', 'shop', 'market'];
handler.tags = ['gacha'];
handler.command = ['tienda', 'shop', 'market'];
handler.group = true;
export default handler;