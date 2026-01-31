// ============================================
// lib/rpg/resource-system.js
// ============================================
export const RESOURCE_SYSTEM = {
    // Recursos disponibles
    RESOURCES: {
        MINING: {
            stone: { name: 'Piedra', value: 5, rarity: 'common', emoji: '🪨' },
            iron: { name: 'Hierro', value: 20, rarity: 'uncommon', emoji: '⚙️' },
            gold: { name: 'Oro', value: 50, rarity: 'rare', emoji: '🟡' },
            diamond: { name: 'Diamante', value: 150, rarity: 'epic', emoji: '💎' },
            emerald: { name: 'Esmeralda', value: 300, rarity: 'legendary', emoji: '💚' },
            mythril: { name: 'Mitril', value: 500, rarity: 'mythic', emoji: '🔷' }
        },
        WOODCUTTING: {
            wood: { name: 'Madera', value: 3, rarity: 'common', emoji: '🪵' },
            oak: { name: 'Roble', value: 10, rarity: 'uncommon', emoji: '🌳' },
            maple: { name: 'Arce', value: 25, rarity: 'rare', emoji: '🍁' },
            ebony: { name: 'Ébano', value: 60, rarity: 'epic', emoji: '⚫' },
            magic: { name: 'Madera Mágica', value: 120, rarity: 'legendary', emoji: '✨' }
        },
        FISHING: {
            fish: { name: 'Pescado', value: 8, rarity: 'common', emoji: '🐟' },
            salmon: { name: 'Salmón', value: 25, rarity: 'uncommon', emoji: '🐠' },
            tuna: { name: 'Atún', value: 45, rarity: 'rare', emoji: '🐋' },
            shark: { name: 'Tiburón', value: 100, rarity: 'epic', emoji: '🦈' },
            dragon: { name: 'Pez Dragón', value: 250, rarity: 'legendary', emoji: '🐉' }
        }
    },

    // Herramientas
    TOOLS: {
        PICKAXES: {
            basic: { name: 'Pico Básico', level: 1, price: 500, efficiency: 1.0, durability: 50, emoji: '⛏️' },
            iron: { name: 'Pico de Hierro', level: 2, price: 2000, efficiency: 1.5, durability: 100, emoji: '⛏️⚙️' },
            gold: { name: 'Pico de Oro', level: 3, price: 5000, efficiency: 2.0, durability: 150, emoji: '⛏️🟡' },
            diamond: { name: 'Pico de Diamante', level: 4, price: 15000, efficiency: 3.0, durability: 300, emoji: '⛏️💎' },
            mythril: { name: 'Pico de Mitril', level: 5, price: 50000, efficiency: 5.0, durability: 500, emoji: '⛏️🔷' }
        },
        AXES: {
            basic: { name: 'Hacha Básica', level: 1, price: 300, efficiency: 1.0, durability: 40, emoji: '🪓' },
            iron: { name: 'Hacha de Hierro', level: 2, price: 1500, efficiency: 1.4, durability: 80, emoji: '🪓⚙️' },
            gold: { name: 'Hacha de Oro', level: 3, price: 4000, efficiency: 1.8, durability: 120, emoji: '🪓🟡' },
            diamond: { name: 'Hacha de Diamante', level: 4, price: 12000, efficiency: 2.5, durability: 200, emoji: '🪓💎' }
        },
        FISHING_RODS: {
            basic: { name: 'Caña Básica', level: 1, price: 400, efficiency: 1.0, durability: 60, emoji: '🎣' },
            iron: { name: 'Caña Mejorada', level: 2, price: 1800, efficiency: 1.3, durability: 90, emoji: '🎣⚙️' },
            gold: { name: 'Caña de Oro', level: 3, price: 4500, efficiency: 1.7, durability: 130, emoji: '🎣🟡' },
            diamond: { name: 'Caña de Diamante', level: 4, price: 14000, efficiency: 2.2, durability: 180, emoji: '🎣💎' }
        }
    },

    // Items crafteables
    CRAFT_ITEMS: {
        weapons: {
            wooden_sword: { name: 'Espada de Madera', materials: { wood: 20 }, value: 100, emoji: '⚔️' },
            iron_sword: { name: 'Espada de Hierro', materials: { wood: 10, iron: 15 }, value: 500, emoji: '🗡️' },
            diamond_sword: { name: 'Espada de Diamante', materials: { wood: 5, diamond: 3, gold: 10 }, value: 2500, emoji: '⚔️💎' }
        },
        armor: {
            leather_armor: { name: 'Armadura de Cuero', materials: { fish: 30, wood: 15 }, value: 300, emoji: '🛡️' },
            iron_armor: { name: 'Armadura de Hierro', materials: { iron: 40, gold: 5 }, value: 1500, emoji: '🥋' },
            diamond_armor: { name: 'Armadura de Diamante', materials: { diamond: 10, gold: 20, iron: 30 }, value: 8000, emoji: '🛡️💎' }
        },
        tools: {
            iron_pickaxe_kit: { name: 'Kit Pico Hierro', materials: { iron: 25, wood: 10 }, value: 1500, emoji: '⛏️⚙️' },
            diamond_axe_kit: { name: 'Kit Hacha Diamante', materials: { diamond: 5, gold: 15, wood: 20 }, value: 10000, emoji: '🪓💎' }
        }
    }
};

// Funciones utilitarias
export function getRandomResource(resourceType, toolLevel = 1) {
    const resources = RESOURCE_SYSTEM.RESOURCES[resourceType];
    const entries = Object.entries(resources);
    
    // Aumenta probabilidades con nivel de herramienta
    const rarityMultiplier = {
        common: 1,
        uncommon: toolLevel >= 2 ? 1.5 : 1,
        rare: toolLevel >= 3 ? 1.3 : 0.7,
        epic: toolLevel >= 4 ? 1.1 : 0.4,
        legendary: toolLevel >= 5 ? 0.8 : 0.1,
        mythic: toolLevel >= 5 ? 0.3 : 0.05
    };

    let totalWeight = 0;
    const weightedResources = [];

    entries.forEach(([key, resource]) => {
        let weight = 100 / (Object.keys(resources).indexOf(key) + 1);
        weight *= rarityMultiplier[resource.rarity] || 1;
        weightedResources.push({ key, resource, weight });
        totalWeight += weight;
    });

    let random = Math.random() * totalWeight;
    for (const item of weightedResources) {
        if (random < item.weight) {
            return { ...item.resource, id: item.key };
        }
        random -= item.weight;
    }

    return weightedResources[0].resource;
}

export function calculateResourceAmount(toolLevel, efficiency) {
    const base = 1 + Math.floor(Math.random() * 3);
    return Math.floor(base * efficiency * (1 + (toolLevel * 0.5)));
}