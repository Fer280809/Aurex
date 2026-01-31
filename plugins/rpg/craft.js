// ============================================
// plugins/rpg/craft.js
// ============================================
import { RESOURCE_SYSTEM } from '../../lib/rpg/resource-system.js';

const handler = async (m, { conn, usedPrefix, args }) => {
    if (!global.db.data.chats[m.chat].economy && m.isGroup) {
        return m.reply(`🚫 *Economía desactivada*\n\nUn *administrador* puede activarla con:\n» *${usedPrefix}economy on*`);
    }

    const user = global.db.data.users[m.sender];
    const itemName = args[0]?.toLowerCase();
    const amount = parseInt(args[1]) || 1;

    if (!user.inventory) {
        user.inventory = {
            resources: {},
            tools: { pickaxe: 'basic', axe: 'basic', fishingRod: 'basic' },
            durability: { pickaxe: 100, axe: 100, fishingRod: 100 },
            crafted: {}
        };
    }

    // LISTAR ITEMS CRAFTEABLES
    if (!itemName) {
        let text = `⚒️ *SISTEMA DE CRAFTEO*\n\n`;
        
        text += `🗡️ *ARMAS:*\n`;
        for (const [id, item] of Object.entries(RESOURCE_SYSTEM.CRAFT_ITEMS.weapons)) {
            const owned = user.inventory?.crafted?.[id] || 0;
            text += `▸ ${item.emoji} ${item.name} ${owned > 0 ? `(${owned})` : ''}\n`;
            for (const [mat, req] of Object.entries(item.materials)) {
                const has = user.inventory?.resources?.[mat] || 0;
                text += `   ${mat}: ${has}/${req} ${has >= req ? '✅' : '❌'}\n`;
            }
            text += `\n`;
        }
        
        text += `🛡️ *ARMADURAS:*\n`;
        for (const [id, item] of Object.entries(RESOURCE_SYSTEM.CRAFT_ITEMS.armor)) {
            const owned = user.inventory?.crafted?.[id] || 0;
            text += `▸ ${item.emoji} ${item.name} ${owned > 0 ? `(${owned})` : ''}\n`;
            for (const [mat, req] of Object.entries(item.materials)) {
                const has = user.inventory?.resources?.[mat] || 0;
                text += `   ${mat}: ${has}/${req} ${has >= req ? '✅' : '❌'}\n`;
            }
            text += `\n`;
        }
        
        text += `🔧 *HERRAMIENTAS:*\n`;
        for (const [id, item] of Object.entries(RESOURCE_SYSTEM.CRAFT_ITEMS.tools)) {
            const owned = user.inventory?.crafted?.[id] || 0;
            text += `▸ ${item.emoji} ${item.name} ${owned > 0 ? `(${owned})` : ''}\n`;
            for (const [mat, req] of Object.entries(item.materials)) {
                const has = user.inventory?.resources?.[mat] || 0;
                text += `   ${mat}: ${has}/${req} ${has >= req ? '✅' : '❌'}\n`;
            }
            text += `\n`;
        }
        
        text += `📌 *Uso:* ${usedPrefix}craft [item] [cantidad]\n`;
        text += `📌 *Ejemplo:* ${usedPrefix}craft wooden_sword`;
        
        await conn.reply(m.chat, text, m);
        return;
    }

    // CRAFTEAR ITEM ESPECÍFICO
    let itemData = null;
    let category = '';
    
    // Buscar en todas las categorías
    for (const [cat, items] of Object.entries(RESOURCE_SYSTEM.CRAFT_ITEMS)) {
        if (items[itemName]) {
            itemData = items[itemName];
            category = cat;
            break;
        }
    }
    
    if (!itemData) {
        return m.reply(`❌ Item no encontrado. Usa *${usedPrefix}craft* para ver la lista.`);
    }

    // Verificar materiales
    for (const [material, required] of Object.entries(itemData.materials)) {
        const has = user.inventory?.resources?.[material] || 0;
        if (has < required * amount) {
            return m.reply(`❌ Necesitas ${required * amount} ${material}, solo tienes ${has}`);
        }
    }

    // Consumir materiales
    for (const [material, required] of Object.entries(itemData.materials)) {
        user.inventory.resources[material] -= required * amount;
        if (user.inventory.resources[material] <= 0) {
            delete user.inventory.resources[material];
        }
    }

    // Agregar item crafteado
    if (!user.inventory.crafted) user.inventory.crafted = {};
    user.inventory.crafted[itemName] = (user.inventory.crafted[itemName] || 0) + amount;

    // Bonificación para owners
    if (global.owner && global.owner.includes(m.sender) && amount === 1) {
        user.inventory.crafted[itemName] += 1;
        amount += 1;
    }

    await m.reply(`🎉 Has crafteado ${amount}x ${itemData.emoji} *${itemData.name}*!\nUsa *${usedPrefix}inventory crafted* para ver tus objetos.`);
    await global.db.write();
};

handler.help = ['craft', 'craftear'];
handler.tags = ['rpg'];
handler.command = ['craft', 'craftear'];
handler.group = true;

export default handler;