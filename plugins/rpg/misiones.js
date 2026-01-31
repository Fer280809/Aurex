// ============================================
// plugins/rpg/missions.js (VERSIÓN CON SISTEMA ALEATORIO)
// ============================================

// Importar el sistema de misiones aleatorias
import { missionSystem } from '../../lib/rpg/mission-system.js';

const handler = async (m, { conn, usedPrefix, command, text }) => {
    // Verificar si economía está activada
    if (m.isGroup && (!global.db.data.chats[m.chat] || !global.db.data.chats[m.chat].economy)) {
        return m.reply(`🚫 *Economía desactivada*\n\nUn *administrador* puede activarla con:\n» *${usedPrefix}economy on*`);
    }

    const user = global.db.data.users[m.sender];
    
    // Inicializar usuario si no existe
    if (!user) {
        global.db.data.users[m.sender] = {
            coin: 1000,
            bank: 0,
            health: 100,
            level: 1,
            xp: 0,
            minedToday: 0,
            choppedToday: 0,
            fishedToday: 0,
            craftedToday: 0,
            soldToday: 0,
            inventory: {
                resources: {},
                tools: { pickaxe: 'basic', axe: 'basic', fishingRod: 'basic' },
                durability: { pickaxe: 100, axe: 100, fishingRod: 100 },
                missions: {
                    daily: { streak: 0, lastCompleted: 0, completed: [], lastClaimed: {} },
                    weekly: { completed: [], lastClaimed: {} },
                    monthly: { completed: [], lastClaimed: {} }
                }
            }
        };
    }
    
    // Asegurar estructura básica
    user.coin = user.coin || 1000;
    user.bank = user.bank || 0;
    user.health = user.health || 100;
    user.level = user.level || 1;
    user.xp = user.xp || 0;
    
    // Inicializar tracking diario
    user.minedToday = user.minedToday || 0;
    user.choppedToday = user.choppedToday || 0;
    user.fishedToday = user.fishedToday || 0;
    user.craftedToday = user.craftedToday || 0;
    user.soldToday = user.soldToday || 0;
    
    // Asegurar estructura de inventario y misiones
    if (!user.inventory) user.inventory = {};
    if (!user.inventory.missions) {
        user.inventory.missions = {
            daily: { streak: 0, lastCompleted: 0, completed: [], lastClaimed: {} },
            weekly: { completed: [], lastClaimed: {} },
            monthly: { completed: [], lastClaimed: {} }
        };
    }

    // Obtener argumentos
    const args = text ? text.trim().split(/ +/) : [];
    const action = args[0]?.toLowerCase() || 'view';
    const missionType = args[1]?.toLowerCase() || 'daily';
    
    // FUNCIÓN para verificar progreso de misión
    const checkMissionProgress = (user, mission) => {
        switch(mission.requirement.type) {
            case 'mine':
                return (user.minedToday || 0) >= mission.requirement.amount;
            case 'chop':
                return (user.choppedToday || 0) >= mission.requirement.amount;
            case 'fish':
                return (user.fishedToday || 0) >= mission.requirement.amount;
            case 'craft':
                return (user.craftedToday || 0) >= mission.requirement.amount;
            case 'sell':
                return (user.soldToday || 0) >= mission.requirement.amount;
            case 'bank':
                return (user.bank || 0) >= mission.requirement.amount;
            case 'collect':
                if (!mission.requirement.resources) return false;
                return mission.requirement.resources.every(res => 
                    (user.inventory?.resources?.[res] || 0) >= mission.requirement.amount
                );
            case 'streak':
                return (user.inventory.missions.daily.streak || 0) >= mission.requirement.amount;
            default:
                return false;
        }
    };

    // FUNCIÓN para obtener progreso actual
    const getMissionProgress = (user, mission) => {
        switch(mission.requirement.type) {
            case 'mine': return user.minedToday || 0;
            case 'chop': return user.choppedToday || 0;
            case 'fish': return user.fishedToday || 0;
            case 'craft': return user.craftedToday || 0;
            case 'sell': return user.soldToday || 0;
            case 'bank': return user.bank || 0;
            case 'collect':
                if (!mission.requirement.resources) return 0;
                const minResource = Math.min(...mission.requirement.resources.map(res => 
                    user.inventory?.resources?.[res] || 0
                ));
                return minResource;
            case 'streak': return user.inventory.missions.daily.streak || 0;
            default: return 0;
        }
    };

    // FUNCIÓN para formatear tiempo restante
    const formatTimeRemaining = (nextReset) => {
        const now = Date.now();
        const diff = nextReset - now;
        
        if (diff <= 0) return '¡Ahora mismo!';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    // --- VER MISIONES ---
    if (action === 'view' || action === 'ver' || !action) {
        // Obtener misiones aleatorias del sistema
        const dailyMissions = missionSystem.getMissions('daily');
        const weeklyMissions = missionSystem.getMissions('weekly');
        const monthlyMissions = missionSystem.getMissions('monthly');
        
        // Tiempos de reinicio
        const now = Date.now();
        const dailyReset = missionSystem.lastReset.daily + (24 * 60 * 60 * 1000);
        const weeklyReset = missionSystem.lastReset.weekly + (7 * 24 * 60 * 60 * 1000);
        const monthlyReset = missionSystem.lastReset.monthly + (30 * 24 * 60 * 60 * 1000);
        
        let text = `╭━━━━━━━━━━━━━━━━━━━━━╮
┃   🎯 *MISIONES ALEATORIAS*   🎯
┃━━━━━━━━━━━━━━━━━━━━━┃
👤 *Usuario:* ${await conn.getName(m.sender)}
📅 *Racha actual:* ${user.inventory.missions.daily.streak || 0} día${(user.inventory.missions.daily.streak || 0) !== 1 ? 's' : ''}
💰 *Monedas:* ¥${(user.coin || 0).toLocaleString()}
🎚️ *Nivel:* ${user.level || 1}\n\n`;

        // Mostrar tiempo de reinicio
        text += `⏰ *Reinicio en:*\n`;
        text += `▸ Diarias: ${formatTimeRemaining(dailyReset)}\n`;
        text += `▸ Semanales: ${formatTimeRemaining(weeklyReset)}\n`;
        text += `▸ Mensuales: ${formatTimeRemaining(monthlyReset)}\n\n`;

        // MISIONES DIARIAS
        text += `📅 *MISIONES DIARIAS:*\n\n`;
        
        if (dailyMissions.length === 0) {
            text += `🔄 *Generando nuevas misiones...*\n`;
            text += `Vuelve a usar el comando en unos segundos.\n\n`;
        } else {
            dailyMissions.forEach((mission, index) => {
                const completed = user.inventory.missions.daily.completed?.includes(mission.id) || false;
                const canClaim = checkMissionProgress(user, mission) && !completed;
                const progress = getMissionProgress(user, mission);
                const total = mission.requirement.amount;
                const percentage = Math.min(Math.floor((progress / total) * 100), 100);
                
                // Barra de progreso
                const barLength = 10;
                const filled = Math.floor((percentage / 100) * barLength);
                const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
                
                text += `${completed ? '✅' : canClaim ? '🎯' : '📌'} *${index + 1}. ${mission.name}*\n`;
                text += `   ${mission.description}\n`;
                text += `   [${bar}] ${progress}/${total} (${percentage}%)\n`;
                text += `   🎁 Recompensa: ¥${mission.reward.coin.toLocaleString()}`;
                
                if (mission.reward.resource) {
                    text += ` + ${mission.reward.amount}x ${mission.reward.resource}`;
                }
                if (mission.reward.special) {
                    text += ` + ${mission.reward.special.replace('_', ' ')}`;
                }
                text += `\n   📌 ${usedPrefix}mission claim daily ${index + 1}\n\n`;
            });
        }

        // MISIONES SEMANALES (si existen)
        if (weeklyMissions.length > 0) {
            text += `🗓️ *MISIONES SEMANALES:*\n\n`;
            weeklyMissions.forEach((mission, index) => {
                const completed = user.inventory.missions.weekly.completed?.includes(mission.id) || false;
                text += `${completed ? '✅' : '📌'} *${mission.name}*\n`;
                text += `   ${mission.description}\n`;
                text += `   🎁 Recompensa: ¥${mission.reward.coin.toLocaleString()}`;
                if (mission.reward.special) {
                    text += ` + ${mission.reward.special.replace('_', ' ')}`;
                }
                text += `\n\n`;
            });
        }

        // MISIONES MENSUALES (si existen)
        if (monthlyMissions.length > 0) {
            text += `📊 *MISIONES MENSUALES:*\n\n`;
            monthlyMissions.forEach((mission, index) => {
                const completed = user.inventory.missions.monthly.completed?.includes(mission.id) || false;
                text += `${completed ? '✅' : '📌'} *${mission.name}*\n`;
                text += `   ${mission.description}\n`;
                text += `   🎁 Recompensa: ¥${mission.reward.coin.toLocaleString()}`;
                if (mission.reward.special) {
                    text += ` + ${mission.reward.special.replace('_', ' ')}`;
                }
                text += `\n\n`;
            });
        }

        text += `╰━━━━━━━━━━━━━━━━━━━━━╯\n`;
        text += `📌 *Uso:* ${usedPrefix}mission claim [daily/weekly/monthly] [número]`;

        await conn.reply(m.chat, text, m);
        return;
    }

    // --- RECLAMAR MISIÓN ---
    if (action === 'claim' || action === 'reclamar') {
        const missionType = args[1]?.toLowerCase() || 'daily';
        const missionNumber = parseInt(args[2]);
        
        if (isNaN(missionNumber) || missionNumber < 1) {
            return m.reply(`❌ Número inválido.\nUso: *${usedPrefix}mission claim [daily/weekly/monthly] [número]*\nEjemplo: *${usedPrefix}mission claim daily 1*`);
        }
        
        // Obtener misiones del tipo especificado
        let missions, userMissions;
        
        switch(missionType) {
            case 'daily':
                missions = missionSystem.getMissions('daily');
                userMissions = user.inventory.missions.daily;
                break;
            case 'weekly':
                missions = missionSystem.getMissions('weekly');
                userMissions = user.inventory.missions.weekly;
                break;
            case 'monthly':
                missions = missionSystem.getMissions('monthly');
                userMissions = user.inventory.missions.monthly;
                break;
            default:
                return m.reply(`❌ Tipo inválido. Usa: daily, weekly o monthly`);
        }
        
        if (missionNumber > missions.length) {
            return m.reply(`❌ Solo hay ${missions.length} misiones ${missionType}.`);
        }
        
        const missionIndex = missionNumber - 1;
        const mission = missions[missionIndex];
        
        // Verificar si ya completó
        if (userMissions.completed?.includes(mission.id)) {
            return m.reply(`⚠️ Ya has reclamado esta misión ${missionType}.`);
        }
        
        // Verificar progreso
        if (!checkMissionProgress(user, mission)) {
            const progress = getMissionProgress(user, mission);
            const needed = mission.requirement.amount - progress;
            
            let progressText = '';
            switch(mission.requirement.type) {
                case 'mine':
                    progressText = `⛏️ Minado: ${progress}/${mission.requirement.amount} (faltan ${needed})`;
                    break;
                case 'chop':
                    progressText = `🪓 Talado: ${progress}/${mission.requirement.amount} (faltan ${needed})`;
                    break;
                case 'fish':
                    progressText = `🎣 Pesca: ${progress}/${mission.requirement.amount} (faltan ${needed})`;
                    break;
                case 'bank':
                    progressText = `🏦 Banco: ¥${progress.toLocaleString()}/${mission.requirement.amount.toLocaleString()}`;
                    break;
                case 'collect':
                    progressText = `📦 Recursos: ${progress}/${mission.requirement.amount}`;
                    break;
            }
            
            return m.reply(`❌ *Aún no completas la misión!*\n${progressText}`);
        }
        
        // OTORGAR RECOMPENSAS
        userMissions.completed.push(mission.id);
        user.coin += mission.reward.coin;
        
        // Recurso especial
        if (mission.reward.resource) {
            if (!user.inventory.resources) user.inventory.resources = {};
            user.inventory.resources[mission.reward.resource] = 
                (user.inventory.resources[mission.reward.resource] || 0) + (mission.reward.amount || 1);
        }
        
        // Incrementar racha para misiones diarias
        if (missionType === 'daily') {
            user.inventory.missions.daily.streak = (user.inventory.missions.daily.streak || 0) + 1;
            user.inventory.missions.daily.lastCompleted = Date.now();
            
            // Recompensa especial por racha de 3 días
            const streak = user.inventory.missions.daily.streak;
            if (streak >= 3 && !userMissions.completed.includes('streak_reward_3')) {
                userMissions.completed.push('streak_reward_3');
                
                // Otorgar personaje especial
                if (!user.harem) user.harem = [];
                user.harem.push({
                    id: `streak_${Date.now()}`,
                    name: 'Personaje de Racha',
                    claimedAt: Date.now(),
                    from: '3_day_streak',
                    rarity: 'epic'
                });
                
                await m.reply(`🎉 *¡MISIÓN COMPLETADA Y RACHA ALCANZADA!*\n\n` +
                             `✅ ${mission.name}\n` +
                             `💰 Recompensa: ¥${mission.reward.coin.toLocaleString()}\n` +
                             `${mission.reward.resource ? `📦 +${mission.reward.amount}x ${mission.reward.resource}\n` : ''}` +
                             `🔥 *Bonus Racha x${streak}:* ¡Personaje épico obtenido!\n` +
                             `📅 Nueva racha: ${streak} día${streak !== 1 ? 's' : ''}`);
                await global.db.write();
                return;
            }
        }
        
        // Mensaje de éxito
        let rewardText = `🎉 *¡MISIÓN ${missionType.toUpperCase()} COMPLETADA!*\n\n` +
                        `✅ ${mission.name}\n` +
                        `💰 Recompensa: ¥${mission.reward.coin.toLocaleString()}\n`;
        
        if (mission.reward.resource) {
            rewardText += `📦 +${mission.reward.amount || 1}x ${mission.reward.resource}\n`;
        }
        if (mission.reward.special) {
            rewardText += `🎁 + ${mission.reward.special.replace('_', ' ')}\n`;
        }
        if (missionType === 'daily') {
            rewardText += `📅 Racha: ${user.inventory.missions.daily.streak || 0} día${(user.inventory.missions.daily.streak || 0) !== 1 ? 's' : ''}`;
        }
        
        await m.reply(rewardText);
        await global.db.write();
        return;
    }

    // --- VER PROGRESO ---
    if (action === 'progress' || action === 'progreso') {
        let text = `╭━━━━━━━━━━━━━━━━━━━━━╮
┃    📊 *TU PROGRESO*    📊
┃━━━━━━━━━━━━━━━━━━━━━┃\n`;

        text += `📈 *ESTADÍSTICAS DIARIAS:*\n\n`;
        text += `⛏️  Minado: ${user.minedToday || 0}\n`;
        text += `🪓  Talado: ${user.choppedToday || 0}\n`;
        text += `🎣  Pesca: ${user.fishedToday || 0}\n`;
        text += `⚒️  Crafteo: ${user.craftedToday || 0}\n`;
        text += `💰  Ventas: ${user.soldToday || 0}\n`;
        text += `🏦  Banco: ¥${(user.bank || 0).toLocaleString()}\n\n`;
        
        text += `🏆 *LOGROS:*\n`;
        text += `📅 Racha diaria: ${user.inventory.missions.daily.streak || 0} día${(user.inventory.missions.daily.streak || 0) !== 1 ? 's' : ''}\n`;
        text += `✅ Misiones diarias: ${user.inventory.missions.daily.completed?.length || 0}\n`;
        text += `✅ Misiones semanales: ${user.inventory.missions.weekly.completed?.length || 0}\n`;
        text += `✅ Misiones mensuales: ${user.inventory.missions.monthly.completed?.length || 0}\n`;
        text += `💰 Monedas totales: ¥${(user.coin || 0).toLocaleString()}\n`;
        text += `❤️  Salud: ${user.health || 100}/100\n`;
        text += `🎚️  Nivel: ${user.level || 1}\n`;
        text += `⭐  XP: ${user.xp || 0}\n\n`;
        
        // Mostrar progreso de misiones actuales
        const dailyMissions = missionSystem.getMissions('daily');
        if (dailyMissions.length > 0) {
            text += `🎯 *PROGRESO ACTUAL:*\n`;
            dailyMissions.forEach((mission, index) => {
                const progress = getMissionProgress(user, mission);
                const total = mission.requirement.amount;
                const percentage = Math.min(Math.floor((progress / total) * 100), 100);
                
                text += `${index + 1}. ${mission.name.split(' ')[1] || mission.name}: ${progress}/${total} (${percentage}%)\n`;
            });
        }
        
        text += `╰━━━━━━━━━━━━━━━━━━━━━╯`;

        await conn.reply(m.chat, text, m);
        return;
    }

    // --- RESET MANUAL (solo owners) ---
    if (action === 'reset') {
        const senderNumber = m.sender.split('@')[0];
        if (!global.owner || !global.owner.includes(senderNumber)) {
            return m.reply(`❌ Comando solo para owners.`);
        }
        
        const type = args[1]?.toLowerCase() || 'daily';
        
        switch(type) {
            case 'daily':
                // Resetear sistema
                missionSystem.dailyMissions = missionSystem.generateRandomMissions('daily', 3);
                missionSystem.lastReset.daily = Date.now();
                
                // Resetear usuarios
                Object.values(global.db.data.users).forEach(u => {
                    u.minedToday = 0;
                    u.choppedToday = 0;
                    u.fishedToday = 0;
                    u.craftedToday = 0;
                    u.soldToday = 0;
                    if (u.inventory?.missions?.daily) {
                        u.inventory.missions.daily.completed = [];
                    }
                });
                break;
                
            case 'weekly':
                missionSystem.weeklyMissions = missionSystem.generateRandomMissions('weekly', 2);
                missionSystem.lastReset.weekly = Date.now();
                break;
                
            case 'monthly':
                missionSystem.monthlyMissions = missionSystem.generateRandomMissions('monthly', 2);
                missionSystem.lastReset.monthly = Date.now();
                break;
                
            case 'all':
                missionSystem.dailyMissions = missionSystem.generateRandomMissions('daily', 3);
                missionSystem.weeklyMissions = missionSystem.generateRandomMissions('weekly', 2);
                missionSystem.monthlyMissions = missionSystem.generateRandomMissions('monthly', 2);
                missionSystem.lastReset = { daily: Date.now(), weekly: Date.now(), monthly: Date.now() };
                break;
                
            default:
                return m.reply(`❌ Tipo inválido. Usa: daily, weekly, monthly o all`);
        }
        
        await m.reply(`✅ Misiones ${type} reiniciadas. Nuevas misiones generadas.`);
        await global.db.write();
        return;
    }

    // --- HELP ---
    if (action === 'help' || action === 'ayuda') {
        await conn.reply(m.chat, 
            `📘 *AYUDA - SISTEMA DE MISIONES ALEATORIAS*\n\n` +
            `🔀 *Características:*\n` +
            `• Misiones diferentes cada día\n` +
            `• Recompensas aleatorias\n` +
            `• Sistema de rachas\n` +
            `• Misiones semanales y mensuales\n\n` +
            `📌 *Comandos:*\n` +
            `» ${usedPrefix}mission - Ver misiones actuales\n` +
            `» ${usedPrefix}mission claim [tipo] [número] - Reclamar misión\n` +
            `» ${usedPrefix}mission progress - Ver tu progreso\n` +
            `» ${usedPrefix}mission reset [tipo] - Resetear (owners)\n\n` +
            `🎯 *Ejemplos:*\n` +
            `• ${usedPrefix}mission\n` +
            `• ${usedPrefix}mission claim daily 1\n` +
            `• ${usedPrefix}mission claim weekly 1\n` +
            `• ${usedPrefix}mission progress\n\n` +
            `💰 *Tipos de misiones:*\n` +
            `• daily - Se renuevan cada 24h\n` +
            `• weekly - Se renuevan cada 7 días\n` +
            `• monthly - Se renuevan cada 30 días\n\n` +
            `🔥 *Consejo:* Las misiones cambian automáticamente. ¡Revisa diariamente!`,
        m);
        return;
    }

    // --- SI NO SE RECONOCE EL COMANDO ---
    await conn.reply(m.chat, 
        `❓ *Comando no reconocido:* "${action}"\n\n` +
        `Usa *${usedPrefix}mission* para ver las misiones\n` +
        `o *${usedPrefix}mission help* para ver ayuda completa.`,
    m);
};

// Configuración del handler
handler.help = ['mission', 'misiones', 'quest'];
handler.tags = ['rpg'];
handler.command = ['mission', 'misiones', 'quest'];
handler.group = true;

export default handler;