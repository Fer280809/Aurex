// plugins/gacha/accepttrade.js
import fs from 'fs';
import path from 'path';

const handler = async (m, { conn }) => {
    const userId = m.sender;
    
    if (!global.tradeRequests) {
        return m.reply('❌ *No hay intercambios pendientes.*');
    }
    
    // Buscar solicitud
    let tradeId = null;
    let trade = null;
    
    for (const [id, data] of Object.entries(global.tradeRequests)) {
        if (data.user2 === userId && Date.now() < data.expires) {
            tradeId = id;
            trade = data;
            break;
        }
    }
    
    if (!trade) {
        return m.reply('❌ *No tienes intercambios pendientes o expiraron.*');
    }
    
    const usersPath = path.join(process.cwd(), 'lib', 'gacha_users.json');
    const dbPath = path.join(process.cwd(), 'lib', 'characters.json');
    let users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    
    // Realizar intercambio
    const char1 = users[trade.user1].harem[trade.char1Index];
    const char2 = users[trade.user2].harem[trade.char2Index];
    
    // Intercambiar
    users[trade.user1].harem[trade.char1Index] = { 
        ...char2, 
        claimedAt: Date.now(),
        forSale: false,
        salePrice: 0,
        traded: true,
        originalOwner: char2.originalOwner || trade.user2
    };
    
    users[trade.user2].harem[trade.char2Index] = { 
        ...char1, 
        claimedAt: Date.now(),
        forSale: false,
        salePrice: 0,
        traded: true,
        originalOwner: char1.originalOwner || trade.user1
    };
    
    // Actualizar DB
    const characters = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const char1Idx = characters.findIndex(c => c.id === char1.id);
    const char2Idx = characters.findIndex(c => c.id === char2.id);
    
    if (char1Idx !== -1) characters[char1Idx].user = trade.user2;
    if (char2Idx !== -1) characters[char2Idx].user = trade.user1;
    
    fs.writeFileSync(dbPath, JSON.stringify(characters, null, 2), 'utf-8');
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf-8');
    
    const user1Name = await conn.getName(trade.user1);
    const user2Name = await conn.getName(trade.user2);
    
    m.reply(`✅ *¡INTERCAMBIO EXITOSO!*\n\n*${user1Name}* recibió *${char2.name}*\n*${user2Name}* recibió *${char1.name}*`);
    
    conn.sendMessage(trade.user1, { 
        text: `✅ *Intercambio completado*\n\nRecibiste *${char2.name}* de *${user2Name}*` 
    });
    
    delete global.tradeRequests[tradeId];
};

handler.help = ['accepttrade', 'aceptar'];
handler.tags = ['gacha'];
handler.command = ['accepttrade', 'aceptar'];
handler.group = true;
export default handler;