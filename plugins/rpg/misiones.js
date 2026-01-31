// ============================================
// plugins/rpg/missions.js
// ============================================
const handler = async (m, { conn, usedPrefix, args }) => {
    if (!global.db.data.chats[m.chat].economy && m.isGroup) {
        return m.reply(`🚫 *Economía desactivada*\n\nUn *administrador* puede activarla con:\n» *${usedPrefix}economy on*`);
    }

    const user = global.db.data.users[m.sender];
    const action = args[0]?.toLowerCase() || 'view';
    const missionType = args[1]?.toLowerCase();

    // Inicializar sistema de misiones
    if (!user.inventory) {
        user.inventory = {
            missions: {
                daily: { streak: 0, lastCompleted: 0, completed: [], rewards: {} },
                weekly: { streak: 0, lastCompleted: 0, completed: [], rewards: {} },
                monthly: { streak: 0, lastCompleted: 0, completed: [], rewards: {} }
            }
        };
    }

    const missions = user.inventory.missions;
    const today = new Date().toDateString();
    const now = Date.now();

    // MISIÓNES DIARIAS
    const dailyMissions = [
        {
            id: 'daily_mine',
            name: 'Minero Novato',
            description: 'Mina 10 recursos',
            requirement: { type: 'mine', amount: 10 },
            reward: { coin: 500, resource: 'iron', amount: 5 }
        },
        {
            id: 'daily_chop',
            name: 'Leñador Aprendiz',
            description: 'Tala 15 recursos',
            requirement: { type: 'chop', amount: 15 },
            reward: { coin: 300, resource: 'oak', amount: 10 }
        },
        {
            id: 'daily_fish',
            name: 'Pescador Principiante',
            description: 'Pesca 8 recursos',
            requirement: { type: 'fish', amount: 8 },
            reward: { coin: 400, resource: 'salmon', amount: 8 }
        },
        {
            id: 'daily_craft',
            name: 'Artesano',
            description: 'Craftea 1 item',
            requirement: { type: 'craft', amount: 1 },
            reward: { coin: 600, resource: 'gold', amount: 3 }
        },
        {
            id: 'daily_streak_3',
            name: 'Racha de 3 Días',
            description: 'Completa misiones por 3 días seguidos',
            requirement: { type: 'streak', amount: 3 },
            reward: { coin: 1500, special: 'character_ticket' }
        }
    ];

    // MISIÓNES SEMANALES
    const weeklyMissions = [
        {
            id: 'weekly_collector',
            name: 'Coleccionista',
            description: 'Consigue 50 de cada recurso básico',
            requirement: { type: 'collect', resources: ['stone', 'wood', 'fish'], amount: 50 },
            reward: { coin: 5000, resource: 'diamond', amount: 5 }
        },
        {
            id: 'weekly_crafter',
            name: 'Maestro Artesano',
            description: 'Craftea 5 items diferentes',
            requirement: { type: 'craft_diverse', amount: 5 },
            reward: { coin: 8000, special: 'diamond_pickaxe' }
        }
    ];

    // MISIÓNES MENSUALES
    const monthlyMissions = [
        {
            id: 'monthly_legend',
            name: 'Leyenda',
            description: 'Consigue 1000 recursos en total',
            requirement: { type: 'total_resources', amount: 1000 },
            reward: { coin: 25000, special: 'legendary_character', resource: 'mythril', amount: 10 }
        },
        {
            id: 'monthly_tycoon',
            name: 'Magnate',
            description: 'Acumula ¥100,000 en el banco',
            requirement: { type: 'bank', amount: 100000 },
            reward: { coin: 50000, special: 'mythril_tools_set' }
        }
    ];

    // VER MISIÓNES
    if (action === 'view' || action === 'ver') {
        let text = `📋 *SISTEMA DE MISIONES*\n\n`;
        
        text += `📅 *MISIONES DIARIAS* (Racha: ${missions.daily.streak} días)\n`;
        dailyMissions.forEach(mission => {
            const completed = missions.daily.completed?.includes(mission.id) || false;
            text += `${completed ? '✅' : '📌'} *${mission.name}*\n`;
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

        text += `🗓️ *MISIONES SEMANALES*\n`;
        weeklyMissions.forEach(mission => {
            const completed = missions.weekly.completed?.includes(mission.id) || false;
            text += `${completed ? '✅' : '📌'} *${mission.name}*\n`;
            text += `   ${mission.description}\n`;
            text += `   Recompensa: ¥${mission.reward.coin.toLocaleString()}`;
            if (mission.reward.special) {
                text += ` + ${mission.reward.special.replace('_', ' ')}`;
            }
            text += `\n\n`;
        });

        text += `📊 *MISIONES MENSUALES*\n`;
        monthlyMissions.forEach(mission => {
            const completed = missions.monthly.completed?.includes(mission.id) || false;
            text += `${completed ? '✅' : '📌'} *${mission.name}*\n`;
            text += `   ${mission.description}\n`;
            text += `   Recompensa: ¥${mission.reward.coin.toLocaleString()}`;
            if (mission.reward.special) {
                text += ` + ${mission.reward.special.replace('_', ' ')}`;
            }
            text += `\n\n`;
        });

        text += `📌 *Uso:* ${usedPrefix}mission claim [diaria/semanal/mensual] [id]`;
        await conn.reply(m.chat, text, m);
        return;
    }

    // RECLAMAR RECOMPENSA
    if (action === 'claim' && missionType) {
        let missionList = [];
        let missionData = null;
        
        if (missionType === 'diaria' || missionType === 'daily') {
            missionList = dailyMissions;
            missionData = missions.daily;
        } else if (missionType === 'semanal' || missionType === 'weekly') {
            missionList = weeklyMissions;
            missionData = missions.weekly;
        } else if (missionType === 'mensual' || missionType === 'monthly') {
            missionList = monthlyMissions;
            missionData = missions.monthly;
        } else {
            return m.reply(`❌ Tipo de misión no válido. Usa: diaria, semanal o mensual`);
        }

        const missionId = args[2];
        const mission = missionList.find(m => m.id === missionId);
        
        if (!mission) {
            return m.reply(`❌ Misión no encontrada. Usa *${usedPrefix}mission view* para ver las misiones.`);
        }

        if (missionData.completed?.includes(missionId)) {
            return m.reply(`⚠️ Ya has reclamado esta misión.`);
        }

        // Verificar si se cumple la misión
        let completed = false;
        
        switch (mission.requirement.type) {
            case 'mine':
                completed = (user.minedToday || 0) >= mission.requirement.amount;
                break;
            case 'chop':
                completed = (user.choppedToday || 0) >= mission.requirement.amount;
                break;
            case 'fish':
                completed = (user.fishedToday || 0) >= mission.requirement.amount;
                break;
            case 'streak':
                completed = missions.daily.streak >= mission.requirement.amount;
                break;
            case 'collect':
                completed = mission.requirement.resources.every(res => 
                    (user.inventory?.resources?.[res] || 0) >= mission.requirement.amount
                );
                break;
            case 'bank':
                completed = (user.bank || 0) >= mission.requirement.amount;
                break;
        }

        if (!completed) {
            return m.reply(`❌ Aún no cumples los requisitos para esta misión.`);
        }

        // Otorgar recompensa
        missionData.completed.push(missionId);
        
        // Monedas
        user.coin += mission.reward.coin;
        
        // Recurso especial
        if (mission.reward.resource) {
            if (!user.inventory.resources) user.inventory.resources = {};
            user.inventory.resources[mission.reward.resource] = 
                (user.inventory.resources[mission.reward.resource] || 0) + mission.reward.amount;
        }

        // Recompensa especial (personaje)
        if (mission.reward.special === 'character_ticket') {
            if (!user.harem) user.harem = [];
            // Personaje especial por racha de 3 días
            const specialCharacter = {
                id: `special_${Date.now()}`,
                name: 'Personaje de Racha',
                claimedAt: Date.now(),
                from: 'daily_streak',
                rarity: 'epic'
            };
            user.harem.push(specialCharacter);
        }

        // Incrementar racha para misiones diarias
        if (missionType === 'diaria' || missionType === 'daily') {
            missions.daily.streak += 1;
            missions.daily.lastCompleted = now;
        }

        await m.reply(`🎉 ¡Misión completada!\n\nRecompensas:\n💰 ¥${mission.reward.coin.toLocaleString()}\n${mission.reward.resource ? `📦 ${mission.reward.amount}x ${mission.reward.resource}\n` : ''}${mission.reward.special ? `🎁 ${mission.reward.special.replace('_', ' ')}\n` : ''}`);
        await global.db.write();
        return;
    }

    // REINICIAR MISIÓNES DIARIAS (solo para owners)
    if (action === 'reset' && global.owner && global.owner.includes(m.sender)) {
        Object.values(global.db.data.users).forEach(u => {
            if (u.inventory?.missions) {
                const today = new Date().toDateString();
                if (u.inventory.missions.daily.lastCompleted !== today) {
                    u.inventory.missions.daily.completed = [];
                    u.minedToday = 0;
                    u.choppedToday = 0;
                    u.fishedToday = 0;
                }
            }
        });
        await m.reply(`✅ Misiones diarias reiniciadas para todos los usuarios.`);
        return;
    }

    await conn.reply(m.chat, `📌 *Uso:* ${usedPrefix}mission [view/claim/reset]\n📌 *Ejemplo:* ${usedPrefix}mission claim diaria daily_mine`, m);
};

handler.help = ['mission', 'misiones', 'quest'];
handler.tags = ['rpg'];
handler.command = ['mission', 'misiones', 'quest'];
handler.group = true;

export default handler;