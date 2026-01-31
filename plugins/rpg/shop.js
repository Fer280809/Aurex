// ============================================
// plugins/rpg/shop.js
// ============================================
import { RESOURCE_SYSTEM } from '../../lib/rpg/resource-system.js';

const handler = async (m, { conn, usedPrefix, args }) => {
    if (!global.db.data.chats[m.chat].economy && m.isGroup) {
        return m.reply(`🚫 *Economía desactivada*\n\nUn *administrador* puede activarla con:\n» *${usedPrefix}economy on*`);
    }

    const user = global.db.data.users[m.sender];
    const category = args[0]?.toLowerCase() || 'main';
    const action = args[1]?.toLowerCase();
    const item = args[2]?.toLowerCase();

    // Inicializar usuario si no existe
    if (!user.inventory) {
        user.inventory = {
            resources: {},
            tools: { pickaxe: 'basic', axe: 'basic', fishingRod: 'basic' },
            durability: { pickaxe: 100, axe: 100, fishingRod: 100 }
        };
    }

    // Inicializar monedas si no existen
    user.coin = user.coin || 0;
    user.bank = user.bank || 0;

    let text = `╭━━━━━━━━━━━━━━━━━━━━━╮
┃      🛒 *TIENDA RPG* 🛒
┃━━━━━━━━━━━━━━━━━━━━━┃
💳 *Saldo disponible:* ¥${user.coin.toLocaleString()}
🏦 *Banco:* ¥${user.bank.toLocaleString()}
💰 *Total:* ¥${(user.coin + user.bank).toLocaleString()}\n\n`;

    // MENÚ PRINCIPAL
    if (category === 'main' || category === 'tienda') {
        text += `📌 *CATEGORÍAS DISPONIBLES:*\n\n`;
        text += `🛠️  *Herramientas:* ${usedPrefix}shop tools\n`;
        text += `   Comprar picos, hachas y cañas de pescar\n\n`;
        text += `🔧  *Reparación:* ${usedPrefix}shop repair\n`;
        text += `   Reparar herramientas desgastadas\n\n`;
        text += `💰  *Vender Recursos:* ${usedPrefix}shop sell\n`;
        text += `   Vender recursos por dinero\n\n`;
        text += `📦  *Recursos (Comprar):* ${usedPrefix}shop buy\n`;
        text += `   Comprar recursos directamente\n\n`;
        text += `🎁  *Items Especiales:* ${usedPrefix}shop special\n`;
        text += `   Items únicos y especiales\n\n`;
        text += `📊  *Info Herramientas:* ${usedPrefix}shop info\n`;
        text += `   Ver estadísticas de herramientas`;
    }
    
    // COMPRAR HERRAMIENTAS
    else if (category === 'tools' || category === 'herramientas') {
        text += `🛠️ *HERRAMIENTAS DISPONIBLES*\n\n`;
        
        // Picos
        text += `⛏️ *PICOS DE MINERÍA:*\n`;
        for (const [id, tool] of Object.entries(RESOURCE_SYSTEM.TOOLS.PICKAXES)) {
            const owned = user.inventory?.tools?.pickaxe === id;
            const currentDurability = user.inventory?.durability?.pickaxe || 100;
            const canAfford = user.coin >= tool.price;
            
            text += `▸ ${tool.emoji} *${tool.name}*\n`;
            text += `   Precio: ${canAfford ? '✅' : '❌'} ¥${tool.price.toLocaleString()}\n`;
            text += `   Nivel: ${'⭐'.repeat(tool.level)} (${tool.level})\n`;
            text += `   Eficiencia: ${tool.efficiency}x\n`;
            text += `   Durabilidad: ${tool.durability}\n`;
            text += `   Estado: ${owned ? `✅ TUYA (${currentDurability}%)` : '❌ NO COMPRADA'}\n`;
            text += `   Comando: ${usedPrefix}shop comprar pico ${id}\n\n`;
        }
        
        // Hachas
        text += `🪓 *HACHAS DE TALA:*\n`;
        for (const [id, tool] of Object.entries(RESOURCE_SYSTEM.TOOLS.AXES)) {
            const owned = user.inventory?.tools?.axe === id;
            const currentDurability = user.inventory?.durability?.axe || 100;
            const canAfford = user.coin >= tool.price;
            
            text += `▸ ${tool.emoji} *${tool.name}*\n`;
            text += `   Precio: ${canAfford ? '✅' : '❌'} ¥${tool.price.toLocaleString()}\n`;
            text += `   Nivel: ${'⭐'.repeat(tool.level)} (${tool.level})\n`;
            text += `   Eficiencia: ${tool.efficiency}x\n`;
            text += `   Durabilidad: ${tool.durability}\n`;
            text += `   Estado: ${owned ? `✅ TUYA (${currentDurability}%)` : '❌ NO COMPRADA'}\n`;
            text += `   Comando: ${usedPrefix}shop comprar hacha ${id}\n\n`;
        }
        
        // Cañas de pescar
        text += `🎣 *CAÑAS DE PESCAR:*\n`;
        for (const [id, tool] of Object.entries(RESOURCE_SYSTEM.TOOLS.FISHING_RODS)) {
            const owned = user.inventory?.tools?.fishingRod === id;
            const currentDurability = user.inventory?.durability?.fishingRod || 100;
            const canAfford = user.coin >= tool.price;
            
            text += `▸ ${tool.emoji} *${tool.name}*\n`;
            text += `   Precio: ${canAfford ? '✅' : '❌'} ¥${tool.price.toLocaleString()}\n`;
            text += `   Nivel: ${'⭐'.repeat(tool.level)} (${tool.level})\n`;
            text += `   Eficiencia: ${tool.efficiency}x\n`;
            text += `   Durabilidad: ${tool.durability}\n`;
            text += `   Estado: ${owned ? `✅ TUYA (${currentDurability}%)` : '❌ NO COMPRADA'}\n`;
            text += `   Comando: ${usedPrefix}shop comprar caña ${id}\n\n`;
        }
        
        text += `📌 *Comandos rápidos:*\n`;
        text += `» ${usedPrefix}shop comprar pico [tipo]\n`;
        text += `» ${usedPrefix}shop comprar hacha [tipo]\n`;
        text += `» ${usedPrefix}shop comprar caña [tipo]`;
    }
    
    // REPARAR HERRAMIENTAS
    else if (category === 'repair' || category === 'reparar') {
        text += `🔧 *REPARAR HERRAMIENTAS*\n\n`;
        
        const tools = [
            { name: 'pico', display: '⛏️ Pico', type: 'pickaxe' },
            { name: 'hacha', display: '🪓 Hacha', type: 'axe' },
            { name: 'caña', display: '🎣 Caña', type: 'fishingRod' }
        ];
        
        let hasToolsToRepair = false;
        
        for (const tool of tools) {
            const durability = user.inventory?.durability?.[tool.type] || 100;
            const cost = Math.floor((100 - durability) * 10);
            
            if (durability < 100) {
                hasToolsToRepair = true;
                const canAfford = user.coin >= cost;
                
                text += `▸ ${tool.display}\n`;
                text += `   Durabilidad: ${durability}%\n`;
                text += `   Costo reparación: ${canAfford ? '✅' : '❌'} ¥${cost.toLocaleString()}\n`;
                text += `   Comando: ${usedPrefix}shop reparar ${tool.name}\n\n`;
            }
        }
        
        if (!hasToolsToRepair) {
            text += `✅ *Todas tus herramientas están al 100% de durabilidad*\n`;
            text += `No necesitas reparar nada en este momento.\n\n`;
        }
        
        text += `💡 *Consejo:* Repara tus herramientas cuando estén por debajo del 50% para evitar que se rompan durante una actividad.`;
    }
    
    // VENDER RECURSOS
    else if (category === 'sell' || category === 'vender') {
        text += `💰 *VENDER RECURSOS*\n\n`;
        
        const resources = user.inventory?.resources || {};
        
        if (Object.keys(resources).length === 0) {
            text += `📭 *No tienes recursos para vender*\n`;
            text += `Ve a minar, talar o pescar para conseguir recursos:\n`;
            text += `» ${usedPrefix}mine - Para minar\n`;
            text += `» ${usedPrefix}chop - Para talar\n`;
            text += `» ${usedPrefix}fish - Para pescar\n`;
        } else {
            text += `📦 *TUS RECURSOS DISPONIBLES:*\n\n`;
            
            // Agrupar por categoría
            const miningResources = [];
            const woodResources = [];
            const fishResources = [];
            
            for (const [id, amount] of Object.entries(resources)) {
                let resourceData = null;
                let categoryType = '';
                
                // Buscar en minería
                if (RESOURCE_SYSTEM.RESOURCES.MINING[id]) {
                    resourceData = RESOURCE_SYSTEM.RESOURCES.MINING[id];
                    categoryType = 'mining';
                }
                // Buscar en tala
                else if (RESOURCE_SYSTEM.RESOURCES.WOODCUTTING[id]) {
                    resourceData = RESOURCE_SYSTEM.RESOURCES.WOODCUTTING[id];
                    categoryType = 'wood';
                }
                // Buscar en pesca
                else if (RESOURCE_SYSTEM.RESOURCES.FISHING[id]) {
                    resourceData = RESOURCE_SYSTEM.RESOURCES.FISHING[id];
                    categoryType = 'fish';
                }
                
                if (resourceData) {
                    const totalValue = resourceData.value * amount;
                    const item = {
                        id,
                        name: resourceData.name,
                        emoji: resourceData.emoji,
                        amount,
                        value: resourceData.value,
                        totalValue,
                        rarity: resourceData.rarity
                    };
                    
                    if (categoryType === 'mining') miningResources.push(item);
                    else if (categoryType === 'wood') woodResources.push(item);
                    else if (categoryType === 'fish') fishResources.push(item);
                }
            }
            
            // Mostrar recursos de minería
            if (miningResources.length > 0) {
                text += `⛏️ *MINERÍA:*\n`;
                miningResources.forEach(resource => {
                    text += `▸ ${resource.emoji} ${resource.name}: ${resource.amount} (¥${resource.totalValue.toLocaleString()})\n`;
                    text += `   Vender todo: ${usedPrefix}shop vender ${resource.id} all\n`;
                    text += `   Vender 10: ${usedPrefix}shop vender ${resource.id} 10\n\n`;
                });
            }
            
            // Mostrar recursos de tala
            if (woodResources.length > 0) {
                text += `🪵 *TALA:*\n`;
                woodResources.forEach(resource => {
                    text += `▸ ${resource.emoji} ${resource.name}: ${resource.amount} (¥${resource.totalValue.toLocaleString()})\n`;
                    text += `   Vender todo: ${usedPrefix}shop vender ${resource.id} all\n`;
                    text += `   Vender 10: ${usedPrefix}shop vender ${resource.id} 10\n\n`;
                });
            }
            
            // Mostrar recursos de pesca
            if (fishResources.length > 0) {
                text += `🐟 *PESCA:*\n`;
                fishResources.forEach(resource => {
                    text += `▸ ${resource.emoji} ${resource.name}: ${resource.amount} (¥${resource.totalValue.toLocaleString()})\n`;
                    text += `   Vender todo: ${usedPrefix}shop vender ${resource.id} all\n`;
                    text += `   Vender 10: ${usedPrefix}shop vender ${resource.id} 10\n\n`;
                });
            }
            
            text += `💡 *Vender múltiples recursos:*\n`;
            text += `» ${usedPrefix}shop vender all - Vender TODO\n`;
            text += `» ${usedPrefix}shop vender common - Vender recursos comunes\n`;
            text += `» ${usedPrefix}shop vender rare - Vender recursos raros`;
        }
    }
    
    // COMPRAR RECURSOS DIRECTAMENTE
    else if (category === 'buy' || category === 'comprar') {
        text += `📦 *COMPRAR RECURSOS DIRECTAMENTE*\n\n`;
        text += `💎 *RECURSOS DISPONIBLES PARA COMPRA:*\n\n`;
        
        // Recursos básicos (para crafteo o emergencias)
        const buyableResources = [
            { id: 'stone', name: 'Piedra', emoji: '🪨', price: 10, category: 'mining' },
            { id: 'wood', name: 'Madera', emoji: '🪵', price: 8, category: 'wood' },
            { id: 'fish', name: 'Pescado', emoji: '🐟', price: 12, category: 'fishing' },
            { id: 'iron', name: 'Hierro', emoji: '⚙️', price: 30, category: 'mining' },
            { id: 'gold', name: 'Oro', emoji: '🟡', price: 60, category: 'mining' }
        ];
        
        buyableResources.forEach(resource => {
            const canAfford = user.coin >= resource.price * 10; // Para 10 unidades
            text += `▸ ${resource.emoji} *${resource.name}*\n`;
            text += `   Precio unitario: ¥${resource.price}\n`;
            text += `   10 unidades: ${canAfford ? '✅' : '❌'} ¥${(resource.price * 10).toLocaleString()}\n`;
            text += `   Comando: ${usedPrefix}shop comprarrecurso ${resource.id} [cantidad]\n\n`;
        });
        
        text += `⚠️ *Nota:* Comprar recursos es más caro que conseguirlos tú mismo.\n`;
        text += `Recomendado solo para emergencias o crafteos urgentes.`;
    }
    
    // ITEMS ESPECIALES
    else if (category === 'special' || category === 'especial') {
        text += `🎁 *ITEMS ESPECIALES*\n\n`;
        
        const specialItems = [
            { 
                id: 'repair_kit', 
                name: 'Kit de Reparación Completo', 
                emoji: '🔧', 
                price: 5000, 
                description: 'Repara TODAS tus herramientas al 100%',
                command: `${usedPrefix}shop comprarespecial repair_kit`
            },
            { 
                id: 'luck_charm', 
                name: 'Amuleto de la Suerte', 
                emoji: '🍀', 
                price: 10000, 
                description: '+20% probabilidad de recursos raros por 24h',
                command: `${usedPrefix}shop comprarespecial luck_charm`
            },
            { 
                id: 'double_rewards', 
                name: 'Poción de Recompensas Dobles', 
                emoji: '🧪', 
                price: 15000, 
                description: 'Recursos x2 por 10 actividades',
                command: `${usedPrefix}shop comprarespecial double_rewards`
            },
            { 
                id: 'character_ticket', 
                name: 'Ticket de Personaje', 
                emoji: '🎫', 
                price: 25000, 
                description: 'Canjeable por un personaje aleatorio',
                command: `${usedPrefix}shop comprarespecial character_ticket`
            }
        ];
        
        specialItems.forEach(item => {
            const canAfford = user.coin >= item.price;
            text += `▸ ${item.emoji} *${item.name}*\n`;
            text += `   ${item.description}\n`;
            text += `   Precio: ${canAfford ? '✅' : '❌'} ¥${item.price.toLocaleString()}\n`;
            text += `   ${item.command}\n\n`;
        });
    }
    
    // INFO HERRAMIENTAS
    else if (category === 'info') {
        text += `📊 *INFORMACIÓN DE TUS HERRAMIENTAS*\n\n`;
        
        const tools = [
            { type: 'pickaxe', name: '⛏️ Pico', data: RESOURCE_SYSTEM.TOOLS.PICKAXES },
            { type: 'axe', name: '🪓 Hacha', data: RESOURCE_SYSTEM.TOOLS.AXES },
            { type: 'fishingRod', name: '🎣 Caña', data: RESOURCE_SYSTEM.TOOLS.FISHING_RODS }
        ];
        
        tools.forEach(toolInfo => {
            const currentTool = user.inventory?.tools?.[toolInfo.type] || 'basic';
            const toolData = toolInfo.data[currentTool];
            const durability = user.inventory?.durability?.[toolInfo.type] || 100;
            
            text += `${toolInfo.name}:\n`;
            text += `▸ Nombre: ${toolData.emoji} ${toolData.name}\n`;
            text += `▸ Nivel: ${toolData.level}/5\n`;
            text += `▸ Eficiencia: ${toolData.efficiency}x\n`;
            text += `▸ Durabilidad: ${durability}/${toolData.durability} (${Math.floor((durability/toolData.durability)*100)}%)\n`;
            text += `▸ Estado: ${durability <= 20 ? '⚠️ CRÍTICO' : durability <= 50 ? '🟡 DESGASTADA' : '✅ BUENA'}\n\n`;
        });
        
        // Próximas mejoras disponibles
        text += `⬆️ *PRÓXIMAS MEJORAS DISPONIBLES:*\n`;
        
        tools.forEach(toolInfo => {
            const currentTool = user.inventory?.tools?.[toolInfo.type] || 'basic';
            const currentLevel = toolInfo.data[currentTool]?.level || 1;
            
            if (currentLevel < 5) {
                const nextTool = Object.entries(toolInfo.data).find(([id, data]) => data.level === currentLevel + 1);
                if (nextTool) {
                    const [nextId, nextData] = nextTool;
                    text += `▸ ${toolInfo.name}: ${nextData.emoji} ${nextData.name} - ¥${nextData.price.toLocaleString()}\n`;
                }
            }
        });
    }

    // PROCESAR COMPRAS DE HERRAMIENTAS
    if (action === 'comprar' && item) {
        const toolType = args[2]?.toLowerCase(); // pico, hacha, caña
        const toolId = args[3]?.toLowerCase(); // basic, iron, gold, etc.
        
        if (!toolType || !toolId) {
            return m.reply(`❌ Formato incorrecto. Uso: ${usedPrefix}shop comprar [pico/hacha/caña] [tipo]\nEjemplo: ${usedPrefix}shop comprar pico iron`);
        }
        
        let toolData = null;
        let targetToolType = '';
        
        // Determinar tipo de herramienta
        if (toolType === 'pico' || toolType === 'pickaxe') {
            toolData = RESOURCE_SYSTEM.TOOLS.PICKAXES[toolId];
            targetToolType = 'pickaxe';
        } else if (toolType === 'hacha' || toolType === 'axe') {
            toolData = RESOURCE_SYSTEM.TOOLS.AXES[toolId];
            targetToolType = 'axe';
        } else if (toolType === 'caña' || toolType === 'fishingrod' || toolType === 'caña') {
            toolData = RESOURCE_SYSTEM.TOOLS.FISHING_RODS[toolId];
            targetToolType = 'fishingRod';
        }
        
        if (!toolData) {
            return m.reply(`❌ Herramienta "${toolId}" no encontrada. Usa ${usedPrefix}shop tools para ver opciones.`);
        }
        
        if (user.coin < toolData.price) {
            return m.reply(`💰 No tienes suficiente dinero. Necesitas ¥${toolData.price.toLocaleString()}, tienes ¥${user.coin.toLocaleString()}`);
        }
        
        // Verificar si ya tiene una mejor o igual
        const currentTool = user.inventory?.tools?.[targetToolType];
        if (currentTool) {
            const currentData = RESOURCE_SYSTEM.TOOLS[targetToolType === 'pickaxe' ? 'PICKAXES' : 
                                                    targetToolType === 'axe' ? 'AXES' : 'FISHING_RODS'][currentTool];
            if (currentData.level >= toolData.level) {
                return m.reply(`⚠️ Ya tienes ${currentData.emoji} ${currentData.name} (nivel ${currentData.level}).\nNecesitas una herramienta de nivel superior.`);
            }
        }
        
        // Comprar herramienta
        user.coin -= toolData.price;
        user.inventory.tools[targetToolType] = toolId;
        user.inventory.durability[targetToolType] = toolData.durability;
        
        await m.reply(`✅ ¡Compra exitosa!\n\n${toolData.emoji} Has comprado *${toolData.name}* por ¥${toolData.price.toLocaleString()}\n💰 Saldo restante: ¥${user.coin.toLocaleString()}\n\n¡Ahora podrás conseguir mejores recursos!`);
        await global.db.write();
        return;
    }
    
    // PROCESAR REPARACIÓN
    else if (action === 'reparar' && item) {
        const toolTypes = {
            'pico': 'pickaxe',
            'pickaxe': 'pickaxe',
            'hacha': 'axe',
            'axe': 'axe',
            'caña': 'fishingRod',
            'caña': 'fishingRod',
            'fishingrod': 'fishingRod'
        };
        
        const toolType = toolTypes[item];
        if (!toolType || !user.inventory?.durability?.[toolType]) {
            return m.reply(`❌ Herramienta no válida. Opciones: pico, hacha, caña`);
        }
        
        const currentDurability = user.inventory.durability[toolType];
        const repairCost = Math.floor((100 - currentDurability) * 10);
        
        if (currentDurability >= 100) {
            return m.reply(`✅ Esta herramienta ya está al 100% de durabilidad`);
        }
        
        if (user.coin < repairCost) {
            return m.reply(`💰 No tienes suficiente dinero. Necesitas ¥${repairCost.toLocaleString()}, tienes ¥${user.coin.toLocaleString()}`);
        }
      