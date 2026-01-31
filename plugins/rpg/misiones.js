// ============================================
// plugins/rpg/missions.js
// ============================================
import { missionSystem } from '../../lib/rpg/mission-system.js';

// Función para formatear tiempo restante
function formatTimeRemaining(nextReset) {
    const now = Date.now();
    const diff = nextReset - now;
    
    if (diff <= 0) return '¡Ahora mismo!';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(' ') || 'Pronto';
}

const handler = async (m, { conn, usedPrefix, args }) => {
    if (!global.db.data.chats[m.chat].economy && m.isGroup) {
        return m.reply(`🚫 *Economía desactivada*\n\nUn *administrador* puede activarla con:\n» *${usedPrefix}economy on*`);
    }

    const user = global.db.data.users[m.sender];
    const action = args[0]?.toLowerCase() || 'view';
    const missionType = args[1]?.toLowerCase();

    // Inicializar sistema de misiones del usuario
    if (!user.inventory) {
        user.inventory = {
            missions: {
                daily: { streak: 0, lastCompleted: 0, completed: [], lastClaimed: {} },
                weekly: { completed: [], lastClaimed: {} },
                monthly: { completed: [], lastClaimed: {} }
            }
        };
    }

    // VER MISIÓNES
    if (action === 'view' || action === 'ver') {
        let text = `📋 *SISTEMA DE MISIONES DINÁMICAS* 📋\n\n`;
        
        // Tiempo restante para reset
        const now = Date.now();
        const dailyReset = missionSystem.lastReset.daily + (24 * 60 * 60 * 1000);
        const weeklyReset = missionSystem.lastReset.weekly + (7 * 24 * 60 * 60 * 1000);
        const monthlyReset = missionSystem.lastReset.monthly + (30 * 24 * 60 * 60 * 1000);
        
        text += `⏰ *Tiempos de reinicio:*\n`;
        text += `▸ Diarias: ${formatTimeRemaining(dailyReset)}\n`;
        text += `▸ Semanales: ${formatTimeRemaining(weeklyReset)}\n`;
        text += `▸ Mensuales: ${formatTimeRemaining(monthlyReset)}\n\n`;
        
        // MISIÓNES DIARIAS
        text += `📅 *MISIONES DIARIAS* (Racha: ${user.inventory.missions.daily.streak || 0} días)\n`;
        const dailyMissions = missionSystem.getMissions('daily');
        
        dailyMissions.forEach((mission, index) => {
            const completed = user.inventory.missions.daily.completed?.includes(mission.id) || false;
            const canClaim = missionSystem.checkMissionCompletion(user, mission) && !completed;
            
            text += `${completed ? '✅' : canClaim ? '🎯' : '📌'} *${mission.name}*\n`;
            text += `   ${mission.description}\n`;
            text += `   Recompensa: ¥${mission.reward.coin.toLocaleString()}`;
            if (mission.reward.resource) {
                text += ` + ${mission.reward.amount}x ${mission.reward.resource}`;
            }
            if (mission.reward.special) {
                text += ` + ${mission.reward.special.replace('_', ' ')}`;
            }
            text += `\n\n`;
        });

        // MISIÓNES SEMANALES
        text += `🗓️ *MISIONES SEMANALES*\n`;
        const weeklyMissions = missionSystem.getMissions('weekly');
        
        weeklyMissions.forEach((mission, index) => {
            const completed = user.inventory.missions.weekly.completed?.includes(mission.id) || false;
            const canClaim = missionSystem.checkMissionCompletion(user, mission) && !completed;
            
            text += `${completed ? '✅' : canClaim ? '🎯' : '📌'} *${mission.name}*\n`;
            text += `   ${mission.description}\n`;
            text += `   Recompensa: ¥${mission.reward.coin.toLocaleString()}`;
            if (mission.reward.special) {
                text += ` + ${mission.reward.special.replace('_', ' ')}`;
            }
            text += `\n\n`;
        });

        // MISIÓNES MENSUALES
        text += `📊 *MISIONES MENSUALES*\n`;
        const monthlyMissions = missionSystem.getMissions('monthly');
        
        monthlyMissions.forEach((mission, index) => {
            const completed = user.inventory.missions.monthly.completed?.includes(mission.id) || false;
            const canClaim = missionSystem.checkMissionCompletion(user, mission) && !completed;
            
            text += `${completed ? '✅' : canClaim ? '🎯' : '📌'} *${mission.name}*\n`;
            text += `   ${mission.description}\n`;
            text += `   Recompensa: ¥${mission.reward.coin.toLocaleString()}`;
            if (mission.reward.special) {
                text += ` + ${mission.reward.special.replace('_', ' ')}`;
            }
            text += `\n\n`;
        });

        text += `📌 *Uso:* ${usedPrefix}mission claim [diaria/semanal/mensual] [número]\n`;
        text += `📌 *Ejemplo:* ${usedPrefix}mission claim diaria 1`;
        
        await conn.reply(m.chat, text, m);
        return;
    }

    // RECLAMAR RECOMPENSA
    if (action === 'claim' && missionType) {
        let missionList = [];
        let userMissions = null;
        let missionIndex = parseInt(args[2]) - 1;
        
        if (missionIndex < 0 || isNaN(missionIndex)) {
            return m.reply(`❌ Debes especificar el número de misión. Ejemplo: ${usedPrefix}mission claim diaria 1`);
        }
        
        if (missionType === 'diaria' || missionType === 'daily') {
            missionList = missionSystem.getMissions('daily');
            userMissions = user.inventory.missions.daily;
        } else if (missionType === 'semanal' || missionType === 'weekly') {
            missionList = missionSystem.getMissions('weekly');
            userMissions = user.inventory.missions.weekly;
        } else if (missionType === 'mensual' || missionType === 'monthly') {
            missionList = missionSystem.getMissions('monthly');
            userMissions = user.inventory.missions.monthly;
        } else {
            return m.reply(`❌ Tipo de misión no válido. Usa: diaria, semanal o mensual`);
        }

        if (missionIndex >= missionList.length) {
            return m.reply(`❌ Número de misión inválido. Solo hay ${missionList.length} misiones disponibles.`);
        }

        const mission = missionList[missionIndex];
        
        if (userMissions.completed?.includes(mission.id)) {
            return m.reply(`⚠️ Ya has reclamado esta misión. Espera al próximo reset.`);
        }

        // Verificar si se cumple la misión
        const completed = missionSystem.checkMissionCompletion(user, mission);
        
        if (!completed) {
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
                case 'bank':
                    progressText = `Banco actual: ¥${(user.bank || 0).toLocaleString()}/${mission.requirement.amount.toLocaleString()}`;
                    break;
            }
            return m.reply(`❌ Aún no cumples los requisitos para esta misión.\n${progressText}`);
        }

        // Otorgar recompensa
        userMissions.completed.push(mission.id);
        
        // Monedas
        user.coin += mission.reward.coin;
        
        // Recurso especial
        if (mission.reward.resource) {
            if (!user.inventory.resources) user.inventory.resources = {};
            user.inventory.resources[mission.reward.resource] = 
                (user.inventory.resources[mission.reward.resource] || 0) + mission.reward.amount;
        }

        // Recompensa especial (personaje)
        if (mission.reward.special && mission.reward.special.includes('character')) {
            if (!user.harem) user.harem = [];
            
            const specialCharacter = {
                id: `mission_${mission.id}_${Date.now()}`,
                name: getCharacterNameByMission(mission),
                claimedAt: Date.now(),
                from: `${missionType}_mission`,
                rarity: missionType === 'mensual' ? 'legendary' : 
                       missionType === 'semanal' ? 'epic' : 'rare'
            };
            user.harem.push(specialCharacter);
        }

        // Incrementar racha para misiones diarias
        if (missionType === 'diaria' || missionType === 'daily') {
            user.inventory.missions.daily.streak = (user.inventory.missions.daily.streak || 0) + 1;
            user.inventory.missions.daily.lastCompleted = Date.now();
            
            // Verificar racha de 3 días para personaje especial
            if (user.inventory.missions.daily.streak >= 3 && 
                !user.inventory.missions.daily.completed.includes('streak_reward_3')) {
                
                user.inventory.missions.daily.completed.push('streak_reward_3');
                
                const streakCharacter = {
                    id: `streak_3_${Date.now()}`,
                    name: 'Personaje de Racha Dorada',
                    claimedAt: Date.now(),
                    from: '3_day_streak',
                    rarity: 'epic'
                };
                user.harem.push(streakCharacter);
                
                await m.reply(`🎉 ¡Misión completada y racha de 3 días alcanzada!\n\nRecompensas:\n💰 ¥${mission.reward.coin.toLocaleString()}\n${mission.reward.resource ? `📦 ${mission.reward.amount}x ${mission.reward.resource}\n` : ''}${mission.reward.special ? `🎁 ${mission.reward.special.replace('_', ' ')}\n` : ''}✨ *Bonus Racha:* ¡Personaje épico obtenido!`);
                await global.db.write();
                return;
            }
        }

        await m.reply(`🎉 ¡Misión completada!\n\nRecompensas:\n💰 ¥${mission.reward.coin.toLocaleString()}\n${mission.reward.resource ? `📦 ${mission.reward.amount}x ${mission.reward.resource}\n` : ''}${mission.reward.special ? `🎁 ${mission.reward.special.replace('_', ' ')}\n` : ''}`);
        await global.db.write();
        return;
    }

    // REINICIAR MANUALMENTE (solo para owners)
    if (action === 'reset' && global.owner && global.owner.includes(m.sender.split('@')[0])) {
        const type = args[1];
        if (type === 'daily' || type === 'all') {
            missionSystem.dailyMissions = missionSystem.generateRandomMissions('daily', 3);
            missionSystem.lastReset.daily = Date.now();
        }
        if (type === 'weekly' || type === 'all') {
            missionSystem.weeklyMissions = missionSystem.generateRandomMissions('weekly', 2);
            missionSystem.lastReset.weekly = Date.now();
        }
        if (type === 'monthly' || type === 'all') {
            missionSystem.monthlyMissions = missionSystem.generateRandomMissions('monthly', 2);
            missionSystem.lastReset.monthly = Date.now();
        }
        
        await m.reply(`✅ Misiones ${type === 'all' ? 'todas' : type} reiniciadas. Nuevas misiones generadas.`);
        return;
    }

    // VER PROGRESO
    if (action === 'progress' || action === 'progreso') {
        let text = `📊 *TU PROGRESO DIARIO*\n\n`;
        text += `⛏️ Minado hoy: ${user.minedToday || 0}\n`;
        text += `🪓 Talado hoy: ${user.choppedToday || 0}\n`;
        text += `🎣 Pesca hoy: ${user.fishedToday || 0}\n`;
        text += `⚒️ Crafteado hoy: ${user.craftedToday || 0}\n`;
        text += `💰 Vendido hoy: ${user.soldToday || 0}\n\n`;
        text += `🏦 Banco: ¥${(user.bank || 0).toLocaleString()}\n`;
        text += `🔥 Racha diaria: ${user.inventory.missions.daily.streak || 0} días\n`;
        
        await conn.reply(m.chat, text, m);
        return;
    }

    await conn.reply(m.chat, `📌 *Uso:* ${usedPrefix}mission [view/claim/progress/reset]\n📌 *Ejemplos:*\n» ${usedPrefix}mission view\n» ${usedPrefix}mission claim diaria 1\n» ${usedPrefix}mission progress\n» ${usedPrefix}mission reset daily (owner only)`, m);
};

// Función para nombres de personajes según misión
function getCharacterNameByMission(mission) {
    const type = mission.type;
    const names = {
        'mine': ['Minero Experto', 'Excavador de Tesoros', 'Picapedrero Maestro'],
        'chop': ['Leñador del Bosque', 'Talador Supremo', 'Guardabosques'],
        'fish': ['Pescador Legendario', 'Cazador de Profundidades', 'Marinero de Alta Mar'],
        'craft': ['Artesano Maestro', 'Forjador Legendario', 'Creador Supremo'],
        'collect': ['Coleccionista de Tesoros', 'Recolector Épico', 'Atesorador Supremo']
    };
    
    const list = names[type] || ['Aventurero', 'Héroe', 'Campeón'];
    return list[Math.floor(Math.random() * list.length)];
}

handler.help = ['mission', 'misiones', 'quest'];
handler.tags = ['rpg'];
handler.command = ['mission', 'misiones', 'quest'];
handler.group = true;

export default handler;