// plugins/gacha-robwaifu.js
import fs from 'fs';
import path from 'path';
import { GACHA_CONFIG, formatCurrency } from '../lib/gacha-config.js';

const handler = async (m, { conn }) => {
    if (!m.mentionedJid || m.mentionedJid.length === 0) {
        return m.reply('❌ *Uso:* /rob @usuario');
    }
    
    const robberId = m.sender;
    const victimId = m.mentionedJid[0];
    const cost = GACHA_CONFIG.prices.robAttempt;
    
    if (robberId === victimId) {
        return m.reply('❌ *No puedes robarte a ti mismo.*');
    }
    
    // VERIFICAR MONEDAS
    const robber = global.db.data.users[robberId] || { coin: 0 };
    if (robber.coin < cost) {
        return m.reply(`❌ *No tienes suficientes monedas para robar.*\nNecesitas: *${formatCurrency(cost)}*\nTienes: *${formatCurrency(robber.coin)}*`);
    }
    
    const usersPath = path.join(process.cwd(), 'lib', 'gacha_users.json');
    const dbPath = path.join(process.cwd(), 'lib', 'characters.json');
    
    let users = {};
    if (fs.existsSync(usersPath)) {
        users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    }
    
    // Verificar si la víctima tiene personajes
    if (!users[victimId] || !users[victimId].harem || users[victimId].harem.length === 0) {
        return m.reply('❌ *Este usuario no tiene personajes para robar.*');
    }
    
    // Inicializar ladrón si no existe
    if (!users[robberId]) {
        users[robberId] = {
            harem: [],
            favorites: [],
            claimMessage: '✧ {user} ha reclamado a {character}!',
            lastRoll: 0,
            votes: {},
            lastRob: 0
        };
    }
    
    // Verificar cooldown
    const now = Date.now();
    if (users[robberId].lastRob && (now - users[robberId].lastRob) < GACHA_CONFIG.cooldowns.rob) {
        const remaining = Math.ceil((GACHA_CONFIG.cooldowns.rob - (now - users[robberId].lastRob)) / 3600000);
        return m.reply(`⏰ *Debes esperar ${remaining} horas para robar nuevamente.*`);
    }
    
    // COBRAR MONEDAS (siempre se cobra)
    robber.coin -= cost;
    
    // Probabilidad de éxito
    const success = Math.random() < GACHA_CONFIG.probabilities.robSuccess;
    
    if (!success) {
        users[robberId].lastRob = now;
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf-8');
        return m.reply(`❌ *¡Robo fallido!* Perdiste *${formatCurrency(cost)}*.\n${victimId.split('@')[0]} se dio cuenta y te atrapó.`);
    }
    
    // ROBO EXITOSO: Seleccionar personaje aleatorio
    const victimHarem = users[victimId].harem.filter(c => !c.forSale); // No robar personajes en venta
    if (victimHarem.length === 0) {
        robber.coin += cost; // Devolver dinero
        return m.reply('❌ *Todos los personajes de este usuario están en venta.* No se pueden robar.');
    }
    
    const randomIndex = Math.floor(Math.random() * victimHarem.length);
    const stolenChar = victimHarem[randomIndex];
    const charIndexInHarem = users[victimId].harem.findIndex(c => c.id === stolenChar.id);
    
    // Verificar si ya lo tiene
    if (users[robberId].harem.find(c => c.id === stolenChar.id)) {
        users[robberId].lastRob = now;
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf-8');
        return m.reply(`⚠️ *Ya tienes este personaje.* Se devolvió *${formatCurrency(cost)}*.`);
    }
    
    // TRANSFERIR PERSONAJE
    users[robberId].harem.push({
        ...stolenChar,
        claimedAt: now,
        forSale: false,
        salePrice: 0,
        stolen: true,
        originalOwner: stolenChar.originalOwner || victimId
    });
    
    users[victimId].harem.splice(charIndexInHarem, 1);
    
    // Actualizar DB principal
    const characters = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const dbCharIndex = characters.findIndex(c => c.id === stolenChar.id);
    if (dbCharIndex !== -1) {
        characters[dbCharIndex].user = robberId;
        fs.writeFileSync(dbPath, JSON.stringify(characters, null, 2), 'utf-8');
    }
    
    // Eliminar de favoritos
    users[victimId].favorites = users[victimId].favorites.filter(id => id !== stolenChar.id);
    
    users[robberId].lastRob = now;
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf-8');
    
    const robberName = await conn.getName(robberId);
    const victimName = await conn.getName(victimId);
    
    m.reply(`🏴‍☠️ *¡ROBO EXITOSO!*\n\n*${robberName}* robó a *${stolenChar.name}* de *${victimName}*\n💸 Costo: *${formatCurrency(cost)}*`);
    
    // Notificar a la víctima
    conn.sendMessage(victimId, {
        text: `🚨 *¡TE HAN ROBADO!*\n\n*${robberName}* te robó a *${stolenChar.name}*\n💰 Recompensa: *${formatCurrency(Math.floor(cost * 0.5))}* si lo recuperas`
    });
};

handler.help = ['rob', 'robar', 'robwaifu'];
handler.tags = ['gacha'];
handler.command = ['rob', 'robar', 'robwaifu'];
handler.group = true;
export default handler;