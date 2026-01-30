// ============================================
// plugins/gacha-robwaifu.js (CON COSTO)
// ============================================
import fs from 'fs';
import path from 'path';

const handler = async (m, { conn, text }) => {
    if (!m.mentionedJid || m.mentionedJid.length === 0) {
        return m.reply('❌ *Uso correcto:* /robwaifu @usuario');
    }
    
    const robberId = m.sender;
    const victimId = m.mentionedJid[0];
    
    if (robberId === victimId) {
        return m.reply('❌ *No puedes robarte a ti mismo.*');
    }
    
    // 1. VERIFICAR MONEDAS
    const user = global.db.data.users[robberId];
    const costoRobo = 500;
    
    if (!user || user.coin < costoRobo) {
        return m.reply(`❌ *No tienes suficientes monedas para robar.*\nNecesitas *¥${costoRobo}* para intentar un robo.`);
    }
    
    const usersPath = path.join(process.cwd(), 'lib', 'gacha_users.json');
    const dbPath = path.join(process.cwd(), 'lib', 'characters.json');
    
    let gachaUsers = {};
    if (fs.existsSync(usersPath)) {
        gachaUsers = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    }
    
    if (!gachaUsers[victimId] || !gachaUsers[victimId].harem || gachaUsers[victimId].harem.length === 0) {
        return m.reply('❌ *Ese usuario no tiene personajes para robar.*');
    }
    
    // Inicializar ladrón si no existe
    if (!gachaUsers[robberId]) {
        gachaUsers[robberId] = {
            harem: [],
            favorites: [],
            claimMessage: '✧ {user} ha reclamado a {character}!',
            lastRoll: 0,
            votes: {}
        };
    }
    
    // Cooldown de 6 horas
    const now = Date.now();
    const cooldown = 21600000; // 6 horas
    
    if (gachaUsers[robberId].lastRob && (now - gachaUsers[robberId].lastRob) < cooldown) {
        const remaining = Math.ceil((cooldown - (now - gachaUsers[robberId].lastRob)) / 3600000);
        return m.reply(`⏰ *Debes esperar ${remaining} horas para robar nuevamente.*`);
    }
    
    // 2. COBRAR LAS MONEDAS (se cobra aunque falle)
    user.coin -= costoRobo;
    
    // Probabilidad de éxito: 30%
    const success = Math.random() < 0.3;
    
    if (!success) {
        gachaUsers[robberId].lastRob = now;
        fs.writeFileSync(usersPath, JSON.stringify(gachaUsers, null, 2), 'utf-8');
        return m.reply(`❌ *¡Intento de robo fallido!* Perdiste *¥${costoRobo}*.`);
    }
    
    // Seleccionar personaje aleatorio
    const randomIndex = Math.floor(Math.random() * gachaUsers[victimId].harem.length);
    const stolenChar = gachaUsers[victimId].harem[randomIndex];
    
    // Verificar si ya tiene el personaje
    const alreadyHas = gachaUsers[robberId].harem.find(c => c.id === stolenChar.id);
    if (alreadyHas) {
        gachaUsers[robberId].lastRob = now;
        fs.writeFileSync(usersPath, JSON.stringify(gachaUsers, null, 2), 'utf-8');
        return m.reply(`⚠️ *Robaste un personaje que ya tenías.* Perdiste *¥${costoRobo}* sin ganar nada.`);
    }
    
    // Transferir personaje
    gachaUsers[robberId].harem.push({ ...stolenChar, claimedAt: now, forSale: false, salePrice: 0 });
    gachaUsers[victimId].harem.splice(randomIndex, 1);
    
    // Actualizar en DB principal
    const characters = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const dbCharIndex = characters.findIndex(c => c.id === stolenChar.id);
    if (dbCharIndex !== -1) {
        characters[dbCharIndex].user = robberId;
        fs.writeFileSync(dbPath, JSON.stringify(characters, null, 2), 'utf-8');
    }
    
    // Eliminar de favoritos de la víctima
    gachaUsers[victimId].favorites = gachaUsers[victimId].favorites.filter(id => id !== stolenChar.id);
    
    gachaUsers[robberId].lastRob = now;
    
    fs.writeFileSync(usersPath, JSON.stringify(gachaUsers, null, 2), 'utf-8');
    
    const robberName = await conn.getName(robberId);
    const victimName = await conn.getName(victimId);
    
    m.reply(`🏴‍☠️ *¡Robo exitoso!*\n\n*${robberName}* le robó *${stolenChar.name}* a *${victimName}*!\n💸 *Costo:* ¥${costoRobo}`);
    
    // Notificar a la víctima
    conn.sendMessage(victimId, { 
        text: `🏴‍☠️ *¡Fuiste robado!*\n\n*${robberName}* te robó a *${stolenChar.name}*!` 
    });
};

handler.help = ['robwaifu', 'robarwaifu'];
handler.tags = ['gacha'];
handler.command = ['robwaifu', 'robarwaifu'];
handler.group = true;

export default handler;