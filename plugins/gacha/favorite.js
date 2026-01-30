// plugins/gacha/favorite.js
import fs from 'fs';
import path from 'path';

const handler = async (m, { conn, text }) => {
    if (!text) {
        return m.reply('❌ *Uso:* /fav <nombre>\nEjemplo: /fav Miku');
    }
    
    const userId = m.sender;
    const usersPath = path.join(process.cwd(), 'lib', 'gacha_users.json');
    
    let users = {};
    if (fs.existsSync(usersPath)) {
        users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    }
    
    if (!users[userId] || !users[userId].harem || users[userId].harem.length === 0) {
        return m.reply('❌ *No tienes personajes para marcar como favorito.*');
    }
    
    const char = users[userId].harem.find(c => 
        c.name.toLowerCase().includes(text.toLowerCase())
    );
    
    if (!char) {
        return m.reply('❌ *No tienes ese personaje en tu harem.*');
    }
    
    // Verificar si ya es favorito
    if (users[userId].favorites.includes(char.id)) {
        // Quitar de favoritos
        users[userId].favorites = users[userId].favorites.filter(id => id !== char.id);
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf-8');
        return m.reply(`❌ *${char.name}* removido de favoritos.`);
    }
    
    // Añadir a favoritos (máximo 10)
    if (users[userId].favorites.length >= 10) {
        return m.reply('❌ *Solo puedes tener 10 favoritos máximo.*');
    }
    
    users[userId].favorites.push(char.id);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf-8');
    
    m.reply(`⭐ *${char.name}* añadido a favoritos. (${users[userId].favorites.length}/10)`);
};

handler.help = ['fav', 'favorite', 'favorito'];
handler.tags = ['gacha'];
handler.command = ['fav', 'favorite', 'favorito'];
handler.group = true;
export default handler;