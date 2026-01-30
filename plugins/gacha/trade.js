// plugins/gacha/trade.js
import fs from 'fs';
import path from 'path';
import { formatCurrency } from '../../lib/gacha-config.js';

const handler = async (m, { conn, text }) => {
    if (!text || !text.includes('/')) {
        return m.reply('❌ *Uso:* /trade <tu personaje> / <personaje del otro>\nEjemplo: /trade Miku / Asuna\n\n*Nota:* Cita el mensaje del usuario');
    }
    
    if (!m.quoted) {
        return m.reply('❌ *Debes citar el mensaje del usuario con quien quieres intercambiar.*');
    }
    
    const user1 = m.sender;
    const user2 = m.quoted.sender;
    
    if (user1 === user2) {
        return m.reply('❌ *No puedes intercambiar contigo mismo.*');
    }
    
    const [char1Name, char2Name] = text.split('/').map(s => s.trim());
    
    const usersPath = path.join(process.cwd(), 'lib', 'gacha_users.json');
    
    let users = {};
    if (fs.existsSync(usersPath)) {
        users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    }
    
    if (!users[user1] || !users[user1].harem || users[user1].harem.length === 0) {
        return m.reply('❌ *No tienes personajes para intercambiar.*');
    }
    
    if (!users[user2] || !users[user2].harem || users[user2].harem.length === 0) {
        return m.reply('❌ *El otro usuario no tiene personajes.*');
    }
    
    // Buscar personajes
    const char1Index = users[user1].harem.findIndex(c => 
        c.name.toLowerCase().includes(char1Name.toLowerCase())
    );
    
    const char2Index = users[user2].harem.findIndex(c => 
        c.name.toLowerCase().includes(char2Name.toLowerCase())
    );
    
    if (char1Index === -1) {
        return m.reply(`❌ *No tienes "${char1Name}"*`);
    }
    
    if (char2Index === -1) {
        return m.reply(`❌ *El otro usuario no tiene "${char2Name}"*`);
    }
    
    // Verificar que no estén en venta
    if (users[user1].harem[char1Index].forSale) {
        return m.reply(`❌ *"${char1Name}" está en venta. Quita de venta primero.*`);
    }
    
    if (users[user2].harem[char2Index].forSale) {
        return m.reply(`❌ *"${char2Name}" está en venta. Pídele que lo quite de venta.*`);
    }
    
    const char1 = users[user1].harem[char1Index];
    const char2 = users[user2].harem[char2Index];
    
    // Guardar solicitud
    global.tradeRequests = global.tradeRequests || {};
    const tradeId = `${user1}_${user2}_${Date.now()}`;
    
    global.tradeRequests[tradeId] = {
        user1,
        user2,
        char1,
        char2,
        char1Index,
        char2Index,
        timestamp: Date.now(),
        expires: Date.now() + 300000 // 5 minutos
    };
    
    const user1Name = await conn.getName(user1);
    const user2Name = await conn.getName(user2);
    
    const tradeMsg = `
╭━━━━━━━━━━━━━━━━╮
│  🔄 *INTERCAMBIO* 🔄
╰━━━━━━━━━━━━━━━━╯

*${user1Name}* quiere intercambiar:
📛 *${char1.name}*
📺 ${char1.source}
💎 Valor: ${char1.value}

Por el personaje de *${user2Name}*:
📛 *${char2.name}*
📺 ${char2.source}
💎 Valor: ${char2.value}

*@${user2.split('@')[0]}* responde con:
✅ */accepttrade* para aceptar
❌ */rejecttrade* para rechazar

⏰ *Expira en 5 minutos*`;

    await conn.sendMessage(m.chat, { text: tradeMsg, mentions: [user2] }, { quoted: m });
    
    setTimeout(() => {
        if (global.tradeRequests && global.tradeRequests[tradeId]) {
            delete global.tradeRequests[tradeId];
        }
    }, 300000);
};

handler.help = ['trade', 'intercambiar'];
handler.tags = ['gacha'];
handler.command = ['trade', 'intercambiar'];
handler.group = true;
export default handler;