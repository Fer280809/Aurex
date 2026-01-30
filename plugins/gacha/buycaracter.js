// plugins/gacha/buycharacter.js
import fs from 'fs';
import path from 'path';
import { formatCurrency } from '../../lib/gacha-config.js';

const handler = async (m, { conn, text }) => {
    if (!text) {
        return m.reply('❌ *Uso:* /buy <nombre>\nEjemplo: /buy Miku');
    }
    
    const buyerId = m.sender;
    const usersPath = path.join(process.cwd(), 'lib', 'gacha_users.json');
    const dbPath = path.join(process.cwd(), 'lib', 'characters.json');
    
    let users = {};
    if (fs.existsSync(usersPath)) {
        users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    }
    
    // Buscar personaje en venta
    let foundChar = null;
    let sellerId = null;
    let charIndex = -1;
    
    for (const [userId, userData] of Object.entries(users)) {
        if (userData.harem) {
            const index = userData.harem.findIndex(c => 
                c.forSale && c.name.toLowerCase().includes(text.toLowerCase())
            );
            if (index !== -1) {
                foundChar = userData.harem[index];
                sellerId = userId;
                charIndex = index;
                break;
            }
        }
    }
    
    if (!foundChar) {
        return m.reply('❌ *No se encontró ese personaje en venta.*');
    }
    
    if (sellerId === buyerId) {
        return m.reply('❌ *No puedes comprar tu propio personaje.*');
    }
    
    // Verificar si ya lo tiene
    if (users[buyerId] && users[buyerId].harem) {
        const alreadyHas = users[buyerId].harem.find(c => c.id === foundChar.id);
        if (alreadyHas) {
            return m.reply('❌ *Ya tienes este personaje en tu harem.*');
        }
    }
    
    // VERIFICAR MONEDAS DEL COMPRADOR
    const buyer = global.db.data.users[buyerId] || { coin: 0 };
    if (buyer.coin < foundChar.salePrice) {
        return m.reply(`❌ *No tienes suficientes monedas.*\nNecesitas: *${formatCurrency(foundChar.salePrice)}*\nTienes: *${formatCurrency(buyer.coin)}*`);
    }
    
    // VERIFICAR MONEDAS DEL VENDEDOR
    if (!global.db.data.users[sellerId]) {
        global.db.data.users[sellerId] = { coin: 0 };
    }
    
    // REALIZAR TRANSACCIÓN
    buyer.coin -= foundChar.salePrice;
    global.db.data.users[sellerId].coin += foundChar.salePrice;
    
    // Inicializar comprador si no existe
    if (!users[buyerId]) {
        users[buyerId] = {
            harem: [],
            favorites: [],
            claimMessage: '✧ {user} ha reclamado a {character}!',
            lastRoll: 0,
            votes: {},
            dailyLastClaim: 0
        };
    }
    
    // TRANSFERIR PERSONAJE
    const transferredChar = {
        ...foundChar,
        forSale: false,
        salePrice: 0,
        bought: true,
        boughtFrom: sellerId,
        boughtAt: Date.now(),
        originalOwner: foundChar.originalOwner || sellerId
    };
    
    users[buyerId].harem.push(transferredChar);
    users[sellerId].harem.splice(charIndex, 1);
    
    // Actualizar DB principal
    const characters = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const dbCharIndex = characters.findIndex(c => c.id === foundChar.id);
    if (dbCharIndex !== -1) {
        characters[dbCharIndex].user = buyerId;
        fs.writeFileSync(dbPath, JSON.stringify(characters, null, 2), 'utf-8');
    }
    
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf-8');
    
    const buyerName = await conn.getName(buyerId);
    const sellerName = await conn.getName(sellerId);
    
    m.reply(`✅ *¡COMPRA EXITOSA!*\n\n*${buyerName}* compró *${foundChar.name}* de *${sellerName}*\n💰 Precio: *${formatCurrency(foundChar.salePrice)}*`);
    
    // Notificar al vendedor
    conn.sendMessage(sellerId, {
        text: `💰 *¡VENTA REALIZADA!*\n\nVendiste *${foundChar.name}* a *${buyerName}*\n💰 Ganaste: *${formatCurrency(foundChar.salePrice)}*\n💵 Nuevo saldo: *${formatCurrency(global.db.data.users[sellerId].coin)}*`
    });
};

handler.help = ['buy', 'comprar', 'buyc'];
handler.tags = ['gacha'];
handler.command = ['buy', 'comprar', 'buyc'];
handler.group = true;
export default handler;