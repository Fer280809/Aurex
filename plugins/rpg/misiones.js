// ============================================
// plugins/rpg/missions.js
// ============================================

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
    
    // Asegurar estructura
    if (!user.inventory) user.inventory = {};
    if (!user.inventory.missions) user.inventory.missions = {};
    if (!user.inventory.missions.daily) user.inventory.missions.daily = { streak: 0, completed: [] };
    if (!user.inventory.missions.weekly) user.inventory.missions.weekly = { completed: [] };
    if (!user.inventory.missions.monthly) user.inventory.missions.monthly = { completed: [] };
    
    // Inicializar tracking diario
    user.minedToday = user.minedToday || 0;
    user.choppedToday = user.choppedToday || 0;
    user.fishedToday = user.fishedToday || 0;
    user.craftedToday = user.craftedToday || 0;
    user.soldToday = user.soldToday || 0;
    user.coin = user.coin || 1000;

    // Obtener argumentos CORRECTAMENTE
    const args = text ? text.trim().split(/ +/) : [];
    const action = args[0]?.toLowerCase();

    // MISIÓNES DISPONIBLES
    const dailyMissions = [
        {
            id: 'mine_10',
            name: '⛏️ Minero Principiante',
            description: 'Mina 10 recursos',
            requirement: { type: 'mine', amount: 10 },
            reward: { coin: 500, resource: 'stone', amount: 5, emoji: '🪨' }
        },
        {
            id: 'chop_15',
            name: '🪓 Leñador Aprendiz',
            description: 'Tala 15 recursos',
            requirement: { type: 'chop', amount: 15 },
            reward: { coin: 300, resource: 'wood', amount: 10, emoji: '🪵' }
        },
        {
            id: 'fish_8',
            name: '🎣 Pescador Novato',
            description: 'Pesca 8 recursos',
            requirement: { type: 'fish', amount: 8 },
            reward: { coin: 400, resource: 'salmon', amount: 8, emoji: '🐠' }
        },
        {
            id: 'craft_3',
            name: '⚒️ Artesano',
            description: 'Craftea 3 items',
            requirement: { type: 'craft', amount: 3 },
            reward: { coin: 600, resource: 'iron', amount: 3, emoji: '⚙️' }
        },
        {
            id: 'sell_20',
            name: '💰 Vendedor',
            description: 'Vende 20 recursos',
            requirement: { type: 'sell', amount: 20 },
            reward: { coin: 450, resource: 'gold', amount: 2, emoji: '🟡' }
        }
    ];

    // FUNCIÓN para verificar misión
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
            default:
                return false;
        }
    };

    // FUNCIÓN para obtener progreso
    const getMissionProgress = (user, mission) => {
        switch(mission.requirement.type) {
            case 'mine': return user.minedToday || 0;
            case 'chop': return user.choppedToday || 0;
            case 'fish': return user.fishedToday || 0;
            case 'craft': return user.craftedToday || 0;
            case 'sell': return user.soldToday || 0;
            default: return 0;
        }
    };

    // --- SIN ARGUMENTOS: MOSTRAR MISIONES ---
    if (!action) {
        let text = `╭━━━━━━━━━━━━━━━━━━━━━╮
┃   📋 *MISIONES DIARIAS*   📋
┃━━━━━━━━━━━━━━━━━━━━━┃
👤 *Usuario:* ${await conn.getName(m.sender)}
📅 *Racha:* ${user.inventory.missions.daily.streak || 0} día${(user.inventory.missions.daily.streak || 0) !== 1 ? 's' : ''}
💰 *Monedas:* ¥${(user.coin || 0).toLocaleString()}\n\n`;

        text += `📊 *TU PROGRESO HOY:*\n`;
        text += `⛏️ Minado: ${user.minedToday || 0}\n`;
        text += `🪓 Talado: ${user.choppedToday || 0}\n`;
        text += `🎣 Pesca: ${user.fishedToday || 0}\n`;
        text += `⚒️ Crafteo: ${user.craftedToday || 0}\n`;
        text += `💰 Ventas: ${user.soldToday || 0}\n\n`;

        text += `🎯 *MISIONES DISPONIBLES:*\n\n`;
        
        dailyMissions.forEach((mission, index) => {
            const completed = user.inventory.missions.daily.completed?.includes(mission.id) || false;
            const progress = getMissionProgress(user, mission);
            const total = mission.requirement.amount;
            const canClaim = checkMissionProgress(user, mission);
            
            // Barra de progreso
            const percentage = Math.min(Math.floor((progress / total) * 100), 100);
            const barLength = 10;
            const filled = Math.floor((percentage / 100) * barLength);
            const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
            
            text += `${completed ? '✅' : canClaim ? '🎯' : '📌'} *${index + 1}. ${mission.name}*\n`;
            text += `   ${mission.description}\n`;
            text += `   [${bar}] ${percentage}% (${progress}/${total})\n`;
            text += `   🎁 Recompensa: ¥${mission.reward.coin.toLocaleString()} + ${mission.reward.amount}x ${mission.reward.emoji}\n\n`;
        });

        text += `╰━━━━━━━━━━━━━━━━━━━━━╯\n`;
        text += `📌 *Comandos:* ${usedPrefix}mission claim [1-5] | ${usedPrefix}mission progress`;

        await conn.reply(m.chat, text, m);
        return;
    }

    // --- CON ARGUMENTOS ---
    
    // RECLAMAR MISIÓN
    if (action === 'claim' || action === 'reclamar') {
        const missionNumber = parseInt(args[1]);
        
        if (isNaN(missionNumber) || missionNumber < 1 || missionNumber > dailyMissions.length) {
            return m.reply(`❌ Número inválido. Usa: *${usedPrefix}mission claim [1-${dailyMissions.length}]*\nEjemplo: *${usedPrefix}mission claim 1*`);
        }
        
        const missionIndex = missionNumber - 1;
        const mission = dailyMissions[missionIndex];
        
        // Verificar si ya completó
        if (user.inventory.missions.daily.completed?.includes(mission.id)) {
            return m.reply(`⚠️ *Ya reclamaste esta misión hoy!*\nEspera al próximo día para nuevas misiones.`);
        }
        
        // Verificar si cumple requisitos
        if (!checkMissionProgress(user, mission)) {
            const progress = getMissionProgress(user, mission);
            const needed = mission.requirement.amount - progress;
            
            return m.reply(`❌ *Aún no completas la misión!*\nTe faltan ${needed} ${mission.requirement.type === 'mine' ? 'recursos minados' : 
                          mission.requirement.type === 'chop' ? 'recursos talados' : 
                          mission.requirement.type === 'fish' ? 'peces pescados' : 
                          mission.requirement.type === 'craft' ? 'items crafteados' : 'recursos vendidos'}.`);
        }
        
        // OTORGAR RECOMPENSAS
        user.inventory.missions.daily.completed.push(mission.id);
        user.coin += mission.reward.coin;
        
        // Agregar recurso al inventario
        if (mission.reward.resource) {
            if (!user.inventory.resources) user.inventory.resources = {};
            user.inventory.resources[mission.reward.resource] = 
                (user.inventory.resources[mission.reward.resource] || 0) + mission.reward.amount;
        }
        
        // Incrementar racha si es primera misión del día
        if (user.inventory.missions.daily.completed.length === 1) {
            user.inventory.missions.daily.streak = (user.inventory.missions.daily.streak || 0) + 1;
        }
        
        // BONUS POR RACHA
        let bonusText = '';
        const streak = user.inventory.missions.daily.streak || 0;
        
        if (streak >= 3) {
            const bonus = Math.floor(mission.reward.coin * 0.5); // 50% extra
            user.coin += bonus;
            bonusText = `\n✨ *Bonus racha x${streak}:* +¥${bonus.toLocaleString()}`;
        }
        
        await m.reply(`🎉 *¡MISIÓN COMPLETADA!*\n\n` +
                     `✅ ${mission.name}\n` +
                     `💰 Recompensa: ¥${mission.reward.coin.toLocaleString()}\n` +
                     `📦 ${mission.reward.emoji} ${mission.reward.amount}x ${mission.reward.resource}\n` +
                     `📅 Racha actual: ${streak} día${streak !== 1 ? 's' : ''}` +
                     bonusText);
        
        await global.db.write();
        return;
    }

    // VER PROGRESO
    if (action === 'progress' || action === 'progreso') {
        let text = `╭━━━━━━━━━━━━━━━━━━━━━╮
┃    📊 *TU PROGRESO*    📊
┃━━━━━━━━━━━━━━━━━━━━━┃\n`;

        text += `📈 *ESTADÍSTICAS DIARIAS:*\n\n`;
        text += `⛏️  Minado: ${user.minedToday || 0}\n`;
        text += `🪓  Talado: ${user.choppedToday || 0}\n`;
        text += `🎣  Pesca: ${user.fishedToday || 0}\n`;
        text += `⚒️  Crafteo: ${user.craftedToday || 0}\n`;
        text += `💰  Ventas: ${user.soldToday || 0}\n\n`;
        
        text += `🏆 *LOGROS:*\n`;
        text += `📅 Racha actual: ${user.inventory.missions.daily.streak || 0} día${(user.inventory.missions.daily.streak || 0) !== 1 ? 's' : ''}\n`;
        text += `✅ Misiones hoy: ${user.inventory.missions.daily.completed?.length || 0}/${dailyMissions.length}\n`;
        text += `💰 Monedas: ¥${(user.coin || 0).toLocaleString()}\n\n`;
        
        // Progreso de cada misión
        text += `🎯 *PROGRESO POR MISIÓN:*\n`;
        dailyMissions.forEach((mission, index) => {
            const progress = getMissionProgress(user, mission);
            const total = mission.requirement.amount;
            const percentage = Math.min(Math.floor((progress / total) * 100), 100);
            
            text += `${index + 1}. ${mission.name.split(' ')[1]}: ${progress}/${total} (${percentage}%)\n`;
        });
        
        text += `╰━━━━━━━━━━━━━━━━━━━━━╯`;

        await conn.reply(m.chat, text, m);
        return;
    }

    // RESET (solo owners)
    if (action === 'reset') {
        const senderNumber = m.sender.split('@')[0];
        if (!global.owner || !global.owner.includes(senderNumber)) {
            return m.reply(`❌ Comando solo para owners.`);
        }
        
        // Resetear todo
        user.minedToday = 0;
        user.choppedToday = 0;
        user.fishedToday = 0;
        user.craftedToday = 0;
        user.soldToday = 0;
        user.inventory.missions.daily.completed = [];
        
        await m.reply(`✅ *Estadísticas reseteadas*\nTodo el progreso diario ha sido reiniciado.`);
        await global.db.write();
        return;
    }

    // HELP
    if (action === 'help' || action === 'ayuda') {
        await conn.reply(m.chat, 
            `📘 *AYUDA - SISTEMA DE MISIONES*\n\n` +
            `📌 *Comandos disponibles:*\n` +
            `» ${usedPrefix}mission - Ver todas las misiones\n` +
            `» ${usedPrefix}mission claim [1-5] - Reclamar misión\n` +
            `» ${usedPrefix}mission progress - Ver tu progreso\n` +
            `» ${usedPrefix}mission reset - Resetear (solo owners)\n\n` +
            `🎯 *Ejemplos:*\n` +
            `• ${usedPrefix}mission\n` +
            `• ${usedPrefix}mission claim 1\n` +
            `• ${usedPrefix}mission progress\n\n` +
            `💰 *Recompensas:*\n` +
            `• Monedas para gastar en la tienda\n` +
            `• Recursos para craftear\n` +
            `• Bonus por racha de días\n\n` +
            `🔥 *Consejo:* Completa las 5 misiones diarias para maximizar tus ganancias!`,
        m);
        return;
    }

    // Si el argumento no es reconocido, mostrar misiones
    await conn.reply(m.chat, 
        `❓ *Argumento no reconocido:* "${action}"\n\n` +
        `Usa *${usedPrefix}mission* para ver las misiones disponibles\n` +
        `o *${usedPrefix}mission help* para ver ayuda completa.`,
    m);
};

// Configuración del handler
handler.help = ['mission', 'misiones', 'quest'];
handler.tags = ['rpg'];
handler.command = ['mission', 'misiones', 'quest'];
handler.group = true;

export default handler;