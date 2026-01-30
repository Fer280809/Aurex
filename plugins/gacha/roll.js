// plugins/gacha-roll.js
import fs from 'fs';
import path from 'path';
import { GACHA_CONFIG, formatCurrency } from '../lib/gacha-config.js';

const handler = async (m, { conn, usedPrefix }) => {
    const userId = m.sender;
    const user = global.db.data.users[userId];
    const cost = GACHA_CONFIG.prices.roll;
    
    // 1. VERIFICAR MONEDAS
    if (!user || user.coin === undefined) {
        user.coin = 0;
        global.db.data.users[userId] = user;
    }
    
    if (user.coin < cost) {
        return m.reply(`❌ *No tienes suficientes monedas.*\nNecesitas *${formatCurrency(cost)}* para usar /roll.\nTienes: *${formatCurrency(user.coin)}*`);
    }
    
    // 2. VERIFICAR COOLDOWN
    const usersPath = path.join(process.cwd(), 'lib', 'gacha_users.json');
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
            dailyLastClaim: 0
        };
    }
    
    const now = Date.now();
    if (gachaUsers[userId].lastRoll && (now - gachaUsers[userId].lastRoll) < GACHA_CONFIG.cooldowns.roll) {
        const remaining = Math.ceil((GACHA_CONFIG.cooldowns.roll - (now - gachaUsers[userId].lastRoll)) / 1000);
        return m.reply(`⏰ *Debes esperar ${remaining} segundos para hacer otro roll.*`);
    }
    
    // 3. COBRAR MONEDAS
    user.coin -= cost;
    
    // 4. OBTENER PERSONAJE ALEATORIO
    const dbPath = path.join(process.cwd(), 'lib', 'characters.json');
    if (!fs.existsSync(dbPath)) {
        user.coin += cost; // Devolver monedas si no hay personajes
        return m.reply('❀ No hay personajes disponibles en la base de datos.');
    }
    
    const characters = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const randomChar = characters[Math.floor(Math.random() * characters.length)];
    
    // 5. MOSTRAR PERSONAJE
    const randomImg = randomChar.img && randomChar.img.length > 0 
        ? randomChar.img[Math.floor(Math.random() * randomChar.img.length)]
        : 'https://i.ibb.co/0Q3J9XZ/file.jpg';
    
    const caption = `
╭━━━━━━━━━━━━━━━━╮
│  🎲 *NUEVO PERSONAJE* 🎲
╰━━━━━━━━━━━━━━━━╯

┌─⊷ *INFORMACIÓN*
│ 📛 *Nombre:* ${randomChar.name}
│ ⚧️ *Género:* ${randomChar.gender}
│ 📺 *Serie:* ${randomChar.source}
│ 💎 *Valor:* ${randomChar.value}
│ 🆔 *ID:* ${randomChar.id}
└───────────────

💰 *Costo del roll:* ${formatCurrency(cost)}
💵 *Saldo restante:* ${formatCurrency(user.coin)}

🎰 *Usa ${usedPrefix}claim citando este mensaje para reclamar!*

⏰ *Tienes 2 minutos para reclamarlo.*`;

    const msg = await conn.sendFile(m.chat, randomImg, 'character.jpg', caption, m);
    
    // 6. ACTUALIZAR DATOS
    gachaUsers[userId].lastRoll = now;
    fs.writeFileSync(usersPath, JSON.stringify(gachaUsers, null, 2), 'utf-8');
    
    // Guardar temporalmente para claim
    global.tempCharacters = global.tempCharacters || {};
    global.tempCharacters[msg.key.id] = {
        character: randomChar,
        timestamp: now,
        expires: now + 120000
    };
    
    // Limpiar después de 2 minutos
    setTimeout(() => {
        if (global.tempCharacters && global.tempCharacters[msg.key.id]) {
            delete global.tempCharacters[msg.key.id];
        }
    }, 120000);
};

handler.help = ['roll', 'rw', 'rollwaifu'];
handler.tags = ['gacha'];
handler.command = ['roll', 'rw', 'rollwaifu'];
handler.group = true;
export default handler;