// ============================================
// plugins/rpg/shop.js
// ============================================
import { RESOURCE_SYSTEM } from '../../lib/rpg/resource-system.js';

const handler = async (m, { conn, usedPrefix, args }) => {
    if (!global.db.data.chats[m.chat].economy && m.isGroup) {
        return m.reply(`🚫 *Economía desactivada*\n\nUn *administrador* puede activarla con:\n» *${usedPrefix}economy on*`);
    }

    const user = global.db.data.users[m.sender];
    const category = args[0]?.toLowerCase() || 'tools';
    const action = args[1]?.toLowerCase();
    const item = args[2]?.toLowerCase();

    let text = `╭━━━━━━━━━━━━━━━━━━━━━╮
┃      🛒 *TIENDA* 🛒
┃━━━━━━━━━━━━━━━━━━━━━┃
💳 *Saldo:* ¥${(user.coin || 0).toLocaleString()}\n\n`;

    // COMPRAR HERRAMIENTAS
    if (category === 'tools' || category === 'comprar') {
        text += `🛠️ *HERRAMIENTAS DISPONIBLES*\n\n`;
        
        // Picos
        text += `⛏️ *PICOS:*\n`;
        for (const [id, tool] of Object.entries(RESOURCE_SYSTEM.TOOLS.PICKAXES)) {
            const owned = user.inventory?.tools?.pickaxe === id;
            text += `▸ ${tool.emoji} ${tool.name} - ¥${tool.price.toLocaleString()}${owned ? ' ✅' : ''}\n`;
            text += `   Nivel: ${tool.level} | Eficiencia: ${tool.efficiency}x | Durabilidad: ${tool.durability}\n`;
        }
        
        text += `\n🪓 *HACHAS:*\n`;
        for (const [id, tool] of Object.entries(RESOURCE_SYSTEM.TOOLS.AXES)) {
            const owned = user.inventory?.tools?.axe === id;
            text += `▸ ${tool.emoji} ${tool.name} - ¥${tool.price.toLocaleString()}${owned ? ' ✅' : ''}\n`;
            text += `   Nivel: ${tool.level} | Eficiencia: ${tool.efficiency}x | Durabilidad: ${tool.durability}\n`;
        }
        
        text += `\n🎣 *CAÑAS:*\n`;
        for (const [id, tool] of Object.entries(RESOURCE_SYSTEM.TOOLS.FISHING_RODS)) {
            const owned = user.inventory?.tools?.fishingRod === id;
            text += `▸ ${tool.emoji} ${tool.name} - ¥${tool.price.toLocaleString()}${owned ? ' ✅' : ''}\n`;
            text += `   Nivel: ${tool.level} | Eficiencia: ${tool.efficiency}x | Durabilidad: ${tool.durability}\n`;
        }
        
        text += `\n📌 *Uso:* ${usedPrefix}shop comprar [pico/hacha/caña] [tipo]`;
    }
    
    // REPARAR HERRAMIENTAS
    else if (category === 'repair') {
        text += `🔧 *REPARAR HERRAMIENTAS*\n\n`;
        
        const tools = ['pickaxe', 'axe', 'fishingRod'];
        for (const tool of tools) {
            const durability = user.inventory?.durability?.[tool] || 100;
            const cost = Math.floor((100 - durability) * 10);
            text += `▸ ${tool === 'pickaxe' ? '⛏️' : tool === 'axe' ? '🪓' : '🎣'} ${tool}: ${durability}% - ¥${cost.toLocaleString()}\n`;
        }
        
        text += `\n📌 *Uso:* ${usedPrefix}shop repair [herramienta]`;
    }
    
    // VENDER RECURSOS
    else if (category === 'sell') {
        text += `💰 *VENDER RECURSOS*\n\n`;
        
        const resources = user.inventory?.resources || {};
        if (Object.keys(resources).length === 0) {
            text += `No tienes recursos para vender.\n`;
        } else {
            for (const [id, amount] of Object.entries(resources)) {
                // Buscar valor del recurso
                let value = 0;
                let emoji = '📦';
                for (const category of Object.values(RESOURCE_SYSTEM.RESOURCES)) {
                    if (category[id]) {
                        value = category[id].value;
                        emoji = category[id].emoji;
                        break;
                    }
                }
                text += `▸ ${emoji} ${id}: ${amount} (¥${(value * amount).toLocaleString()})\n`;
            }
        }
        
        text += `\n📌 *Uso:* ${usedPrefix}shop sell [recurso] [cantidad/all]`;
    }

    // COMPRAR ITEM ESPECÍFICO
    if (action === 'comprar' && item) {
        let toolData = null;
        let toolType = '';
        
        // Buscar en picos
        if (RESOURCE_SYSTEM.TOOLS.PICKAXES[item]) {
            toolData = RESOURCE_SYSTEM.TOOLS.PICKAXES[item];
            toolType = 'pickaxe';
        }
        // Buscar en hachas
        else if (RESOURCE_SYSTEM.TOOLS.AXES[item]) {
            toolData = RESOURCE_SYSTEM.TOOLS.AXES[item];
            toolType = 'axe';
        }
        // Buscar en cañas
        else if (RESOURCE_SYSTEM.TOOLS.FISHING_RODS[item]) {
            toolData = RESOURCE_SYSTEM.TOOLS.FISHING_RODS[item];
            toolType = 'fishingRod';
        }
        
        if (!toolData) {
            return m.reply(`❌ Item no encontrado.`);
        }
        
        if (user.coin < toolData.price) {
            return m.reply(`💰 No tienes suficiente dinero. Necesitas ¥${toolData.price.toLocaleString()}`);
        }
        
        // Verificar si ya tiene una mejor
        const currentTool = user.inventory?.tools?.[toolType];
        if (currentTool && RESOURCE_SYSTEM.TOOLS[toolType === 'pickaxe' ? 'PICKAXES' : 
                                                    toolType === 'axe' ? 'AXES' : 'FISHING_RODS'][currentTool]?.level >= toolData.level) {
            return m.reply(`⚠️ Ya tienes una herramienta igual o mejor.`);
        }
        
        // Comprar
        user.coin -= toolData.price;
        user.inventory.tools[toolType] = item;
        user.inventory.durability[toolType] = toolData.durability;
        
        await m.reply(`✅ Has comprado ${toolData.emoji} *${toolData.name}* por ¥${toolData.price.toLocaleString()}`);
        return;
    }
    
    // REPARAR HERRAMIENTA ESPECÍFICA
    else if (action === 'repair' && item) {
        const toolTypes = {
            'pico': 'pickaxe',
            'pickaxe': 'pickaxe',
            'hacha': 'axe',
            'axe': 'axe',
            'caña': 'fishingRod',
            'fishingrod': 'fishingRod'
        };
        
        const toolType = toolTypes[item];
        if (!toolType || !user.inventory?.durability?.[toolType]) {
            return m.reply(`❌ Herramienta no válida.`);
        }
        
        const currentDurability = user.inventory.durability[toolType];
        const repairCost = Math.floor((100 - currentDurability) * 10);
        
        if (currentDurability >= 100) {
            return m.reply(`✅ Esta herramienta ya está al 100%`);
        }
        
        if (user.coin < repairCost) {
            return m.reply(`💰 No tienes suficiente dinero. Necesitas ¥${repairCost.toLocaleString()}`);
        }
        
        user.coin -= repairCost;
        user.inventory.durability[toolType] = 100;
        
        await m.reply(`🔧 Has reparado tu ${item} por ¥${repairCost.toLocaleString()}`);
        return;
    }
    
    // VENDER RECURSOS
    else if (action === 'sell' && item) {
        const amount = args[3]?.toLowerCase() === 'all' ? 
                      (user.inventory?.resources?.[item] || 0) : 
                      parseInt(args[3]) || 1;
        
        if (!user.inventory?.resources?.[item] || user.inventory.resources[item] < amount) {
            return m.reply(`❌ No tienes suficiente ${item}`);
        }
        
        // Buscar valor
        let value = 0;
        for (const category of Object.values(RESOURCE_SYSTEM.RESOURCES)) {
            if (category[item]) {
                value = category[item].value;
                break;
            }
        }
        
        if (value === 0) {
            return m.reply(`❌ No se puede vender este recurso`);
        }
        
        const totalValue = value * amount;
        user.coin += totalValue;
        user.inventory.resources[item] -= amount;
        if (user.inventory.resources[item] <= 0) {
            delete user.inventory.resources[item];
        }
        
        await m.reply(`💰 Has vendido ${amount} ${item} por ¥${totalValue.toLocaleString()}`);
        return;
    }

    text += `\n╰━━━━━━━━━━━━━━━━━━━━━╯\n`;
    text += `📌 *Categorías:* tools, repair, sell`;

    await conn.reply(m.chat, text, m);
};

handler.help = ['shop', 'tienda'];
handler.tags = ['rpg'];
handler.command = ['shop', 'tienda'];
handler.group = true;

export default handler;