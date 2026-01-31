// ============================================
// plugins/rpg/missions.js (VERSIÓN SIMPLE Y FUNCIONAL)
// ============================================

const handler = async (m, { conn, usedPrefix }) => {
    // Verificar si economía está activada
    if (!global.db.data.chats[m.chat].economy && m.isGroup) {
        return m.reply(`🚫 *Economía desactivada*\n\nUn *administrador* puede activarla con:\n» *${usedPrefix}economy on*`);
    }

    const user = global.db.data.users[m.sender];
    
    // Inicializar usuario si no existe
    if (!user) {
        global.db.data.users[m.sender] = {
            coin: 1000,
            bank: 0,
            health: 100,
            inventory: {
                resources: {},
                tools: { pickaxe: 'basic', axe: 'basic', fishingRod: 'basic' },
                durability: { pickaxe: 100, axe: 100, fishingRod: 100 },
                missions: {
                    daily: { streak: 0, completed: [] },
                    weekly: { completed: [] },
                    monthly: { completed: [] }
                }
            }
        };
    }
    
    // Asegurar que inventory existe
    if (!user.inventory) {
        user.inventory = {
            resources: {},
            tools: { pickaxe: 'basic', axe: 'basic', fishingRod: 'basic' },
            durability: { pickaxe: 100, axe: 100, fishingRod: 100 },
            missions: {
                daily: { streak: 0, completed: [] },
                weekly: { completed: [] },
                monthly: { completed: [] }
            }
        };
    }
    
    // Asegurar que misiones existen
    if (!user.inventory.missions) {
        user.inventory.missions = {
            daily: { streak: 0, completed: [] },
            weekly: { completed: [] },
            monthly: { completed: [] }
        };
    }

    // Obtener argumentos
    const args = m.text.slice(usedPrefix.length).trim().split(/ +/);
    const action = args[0]?.toLowerCase();
    
    // MISIÓNES DISPONIBLES (versión simple)
    const dailyMissions = [
        {
            id: 'mine_10',
            name: 'Minero Principiante',
            description: 'Mina 10 recursos',
            requirement: { type: 'mine', amount: 10 },
            reward: { coin: 500, resource: 'stone', amount: 5 }
        },
        {
            id: 'chop_15',
            name: 'Leñador Aprendiz',
            description: 'Tala 15 recursos',
            requirement: { type: 'chop', amount: 15 },
            reward: { coin: 300, resource: 'wood', amount: 10 }
        },
        {
            id: 'fish_8',
            name: 'Pescador Novato',
            description: 'Pesca 8 recursos',
            requirement: { type: 'fish', amount: 8 },
            reward: { coin: 400, resource: 'fish', amount: 8 }
        }
    ];

    // VER MISIÓNES
    if (!action || action === 'ver' || action === 'view') {
        let text = `📋 *SISTEMA DE MISIONES*\n\n`;
        
        // Información del usuario
        const streak = user.inventory.missions.daily.streak || 0;
        text += `📅 *Racha actual:* ${streak} día${streak !== 1 ? 's' : ''}\n`;
        text += `💰 *Monedas:* ¥${(user.coin || 0).toLocaleString()}\n`;
        text += `⛏️ *Minado hoy:* ${user.minedToday || 0}\n`;
        text += `🪓 *Talado hoy:* ${user.choppedToday || 0}\n`;
        text += `🎣 *Pesca hoy:* ${user.fishedToday || 0}\n\n`;
        
        text += `📝 *MISIONES DIARIAS DISPONIBLES:*\n\n`;
        
        dailyMissions.forEach(mission => {
            const completed = user.inventory.missions.daily.completed?.includes(mission.id) || false;
            const canClaim = checkMissionProgress(user, mission);
            
            text += `${completed ? '✅' : canClaim ? '🎯' : '📌'} *${mission.name}*\n`;
            text += `   ${mission.description}\n`;
            text += `   Recompensa: ¥${mission.reward.coin.toLocaleString()}`;
            if (mission.reward.resource) {
                text += ` + ${mission.reward.amount}x ${mission.reward.resource}`;
            }
            text += `\n   Estado: ${completed ? 'COMPLETADA' : canClaim ? 'LISTA PARA RECLAMAR' : 'EN PROGRESO'}\n\n`;
        });
        
        text += `📌 *Comandos disponibles:*\n`;
        text += `» ${usedPrefix}mission claim [número] - Reclamar misión\n`;
        text += `» ${usedPrefix}mission progress - Ver tu progreso\n`;
        text += `» ${usedPrefix}mission reset - Resetear misiones (owner)\n`;
        
        await conn.reply(m.chat, text, m);
        return;
    }

    // RECLAMAR MISIÓN
    if (action === 'claim' || action === 'reclamar') {
        const missionNumber = parseInt(args[1]) || 1;
        
        if (missionNumber < 1 || missionNumber > dailyMissions.length) {
            return m.reply(`❌ Número de misión inválido. Usa del 1 al ${dailyMissions.length}`);
        }
        
        const mission = dailyMissions[missionNumber - 1];
        
        // Verificar si ya la completó
        if (user.inventory.missions.daily.completed?.includes(mission.id)) {
            return m.reply(`⚠️ Ya has reclamado esta misión hoy.`);
        }
        
        // Verificar progreso
        const canClaim = checkMissionProgress(user, mission);
        
        if (!canClaim) {
            let progressText = '';
            switch(mission.requirement.type) {
                case 'mine':
                    progressText = `Progreso: ${user.minedToday || 0}/${mission.requirement.amount}`;
                    break;
                case 'chop':
                    progressText = `Progreso: ${user.choppedToday || 0}/${mission.requirement.amount}`;
                    break;
                case 'fish':
                    progressText = `Progreso: ${user.fishedToday || 0}/${mission.requirement.amount}`;
                    break;
            }
            return m.reply(`❌ Aún no cumples los requisitos.\n${progressText}`);
        }
        
        // Otorgar recompensa
        user.inventory.missions.daily.completed.push(mission.id);
        
        // Monedas
        user.coin += mission.reward.coin;
        
        // Recurso especial
        if (mission.reward.resource) {
            if (!user.inventory.resources) user.inventory.resources = {};
            user.inventory.resources[mission.reward.resource] = 
                (user.inventory.resources[mission.reward.resource] || 0) + mission.reward.amount;
        }
        
        // Incrementar racha si es la primera misión del día
        if (user.inventory.missions.daily.completed.length === 1) {
            user.inventory.missions.daily.streak = (user.inventory.missions.daily.streak || 0) + 1;
            
            // Recompensa especial por racha de 3 días
            if (user.inventory.missions.daily.streak >= 3) {
                user.coin += 1000;
                await m.reply(`🎉 ¡Misión completada y racha de ${user.inventory.missions.daily.streak} días!\n\n✨ *Bonus Racha:* +¥1,000\n💰 Recompensa: ¥${mission.reward.coin.toLocaleString()}\n📦 +${mission.reward.amount}x ${mission.reward.resource}`);
                await global.db.write();
                return;
            }
        }
        
        await m.reply(`🎉 ¡Misión completada!\n\n💰 Recompensa: ¥${mission.reward.coin.toLocaleString()}\n📦 +${mission.reward.amount}x ${mission.reward.resource}`);
        await global.db.write();
        return;
    }

    // VER PROGRESO
    if (action === 'progress' || action === 'progreso') {
        let text = `📊 *TU PROGRESO ACTUAL*\n\n`;
        
        text += `⛏️ *Minado hoy:* ${user.minedToday || 0}\n`;
        text += `🪓 *Talado hoy:* ${user.choppedToday || 0}\n`;
        text += `🎣 *Pesca hoy:* ${user.fishedToday || 0}\n`;
        text += `⚒️ *Crafteado hoy:* ${user.craftedToday || 0}\n`;
        text += `💰 *Vendido hoy:* ${user.soldToday || 0}\n\n`;
        
        text += `📅 *Estadísticas:*\n`;
        text += `• Racha diaria: ${user.inventory.missions.daily.streak || 0} día${(user.inventory.missions.daily.streak || 0) !== 1 ? 's' : ''}\n`;
        text += `• Misiones completadas hoy: ${user.inventory.missions.daily.completed?.length || 0}/3\n`;
        text += `• Monedas totales: ¥${(user.coin || 0).toLocaleString()}\n`;
        text += `• Salud: ${user.health || 100}/100\n\n`;
        
        text += `💡 *Consejo:* Completa las 3 misiones diarias para mantener tu racha y obtener bonificaciones especiales.`;
        
        await conn.reply(m.chat, text, m);
        return;
    }

    // RESET (solo para owners)
    if (action === 'reset') {
        // Verificar si es owner
        const senderNumber = m.sender.split('@')[0];
        if (!global.owner || !global.owner.includes(senderNumber)) {
            return m.reply(`❌ Solo los owners pueden usar este comando.`);
        }
        
        // Resetear estadísticas diarias
        user.minedToday = 0;
        user.choppedToday = 0;
        user.fishedToday = 0;
        user.craftedToday = 0;
        user.soldToday = 0;
        user.inventory.missions.daily.completed = [];
        
        await m.reply(`✅ Estadísticas diarias reseteadas para ${await conn.getName(m.sender)}`);
        await global.db.write();
        return;
    }

    // Si no se reconoce el comando, mostrar ayuda
    await conn.reply(m.chat, 
        `📌 *Uso del comando mission:*\n\n` +
        `» ${usedPrefix}mission - Ver misiones disponibles\n` +
        `» ${usedPrefix}mission claim [1-3] - Reclamar misión\n` +
        `» ${usedPrefix}mission progress - Ver tu progreso\n` +
        `» ${usedPrefix}mission reset - Resetear (solo owners)\n\n` +
        `*Ejemplos:*\n` +
        `» ${usedPrefix}mission claim 1\n` +
        `» ${usedPrefix}mission progress`,
    m);
};

// Función para verificar progreso de misión
function checkMissionProgress(user, mission) {
    switch(mission.requirement.type) {
        case 'mine':
            return (user.minedToday || 0) >= mission.requirement.amount;
        case 'chop':
            return (user.choppedToday || 0) >= mission.requirement.amount;
        case 'fish':
            return (user.fishedToday || 0) >= mission.requirement.amount;
        default:
            return false;
    }
}

// Configuración del handler
handler.help = ['mission', 'misiones', 'quest'];
handler.tags = ['rpg'];
handler.command = ['mission', 'misiones', 'quest'];
handler.group = true;

export default handler;