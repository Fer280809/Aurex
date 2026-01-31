// ============================================
// lib/rpg/mission-system.js
// ============================================
export class MissionSystem {
    constructor() {
        this.dailyMissions = [];
        this.weeklyMissions = [];
        this.monthlyMissions = [];
        this.lastReset = {
            daily: 0,
            weekly: 0,
            monthly: 0
        };
        this.initializeMissions();
    }

    // Bancos de posibles misiones
    missionTemplates = {
        daily: [
            {
                type: 'mine',
                names: ['⛏️ Minero Novato', '⛏️ Excavador', '⛏️ Buscador de Piedras'],
                descriptions: ['Mina {amount} recursos', 'Excava {amount} minerales', 'Busca {amount} piedras'],
                amounts: [10, 15, 20, 25],
                rewards: { coin: [300, 500, 800], resource: ['stone', 'iron'], amounts: [5, 8, 10] }
            },
            {
                type: 'chop',
                names: ['🪓 Leñador', '🪓 Talador', '🪓 Cortador de Árboles'],
                descriptions: ['Tala {amount} recursos', 'Corta {amount} árboles', 'Recoge {amount} maderas'],
                amounts: [12, 18, 24, 30],
                rewards: { coin: [250, 400, 600], resource: ['wood', 'oak'], amounts: [8, 12, 15] }
            },
            {
                type: 'fish',
                names: ['🎣 Pescador', '🎣 Pescador de Ríos', '🎣 Cazador de Peces'],
                descriptions: ['Pesca {amount} recursos', 'Atrapa {amount} peces', 'Captura {amount} criaturas marinas'],
                amounts: [8, 12, 16, 20],
                rewards: { coin: [350, 550, 750], resource: ['fish', 'salmon'], amounts: [6, 9, 12] }
            },
            {
                type: 'craft',
                names: ['⚒️ Artesano', '⚒️ Creador', '⚒️ Forjador'],
                descriptions: ['Craftea {amount} item', 'Crea {amount} objeto', 'Fabrica {amount} herramienta'],
                amounts: [3, 5, 7, 10],
                rewards: { coin: [400, 650, 900], resource: ['gold', 'iron'], amounts: [3, 5, 7] }
            },
            {
                type: 'sell',
                names: ['💰 Vendedor', '💰 Comerciante', '💰 Mercader'],
                descriptions: ['Vende {amount} recursos', 'Comercializa {amount} items', 'Intercambia {amount} materiales'],
                amounts: [15, 25, 35, 50],
                rewards: { coin: [450, 700, 950], resource: ['gold', 'diamond'], amounts: [2, 3, 5] }
            }
        ],
        weekly: [
            {
                type: 'mine',
                names: ['📅 Minero Semanal', '📅 Excavador Semanal'],
                descriptions: ['Mina {amount} recursos esta semana', 'Excava {amount} minerales semanales'],
                amounts: [50, 75, 100, 150],
                rewards: { coin: [2000, 3500, 5000], resource: ['diamond', 'emerald'], amounts: [3, 5, 8], special: ['weekly_bonus'] }
            },
            {
                type: 'collect',
                names: ['📅 Coleccionista', '📅 Recolector'],
                descriptions: ['Consigue {amount} de cada recurso básico', 'Acumula {amount} recursos variados'],
                amounts: [30, 50, 75, 100],
                rewards: { coin: [2500, 4000, 6000], resource: ['mythril'], amounts: [2, 3, 5], special: ['collection_bonus'] }
            }
        ],
        monthly: [
            {
                type: 'bank',
                names: ['📊 Magnate', '📊 Millonario'],
                descriptions: ['Acumula ¥{amount} en el banco', 'Ahorra ¥{amount} este mes'],
                amounts: [100000, 250000, 500000, 1000000],
                rewards: { coin: [10000, 25000, 50000], special: ['exclusive_character', 'premium_tools', 'legendary_set'] }
            },
            {
                type: 'total_resources',
                names: ['📊 Leyenda', '📊 Épico'],
                descriptions: ['Consigue {amount} recursos en total', 'Acumula {amount} materiales este mes'],
                amounts: [500, 1000, 2000, 5000],
                rewards: { coin: [15000, 30000, 60000], special: ['unique_character', 'legendary_gear'] }
            }
        ]
    };

    // Inicializar misiones aleatorias
    initializeMissions() {
        const now = Date.now();
        
        // Generar nuevas misiones diarias si es necesario
        if (this.shouldReset('daily')) {
            this.dailyMissions = this.generateRandomMissions('daily', 3);
            this.lastReset.daily = now;
        }
        
        // Generar nuevas misiones semanales si es necesario
        if (this.shouldReset('weekly')) {
            this.weeklyMissions = this.generateRandomMissions('weekly', 2);
            this.lastReset.weekly = now;
        }
        
        // Generar nuevas misiones mensuales si es necesario
        if (this.shouldReset('monthly')) {
            this.monthlyMissions = this.generateRandomMissions('monthly', 2);
            this.lastReset.monthly = now;
        }
    }

    // Generar misiones aleatorias
    generateRandomMissions(type, count) {
        const templates = this.missionTemplates[type];
        const missions = [];
        const usedTypes = new Set();
        
        for (let i = 0; i < count; i++) {
            let template;
            do {
                template = templates[Math.floor(Math.random() * templates.length)];
            } while (usedTypes.has(template.type) && usedTypes.size < templates.length);
            
            usedTypes.add(template.type);
            
            const nameIndex = Math.floor(Math.random() * template.names.length);
            const descIndex = Math.floor(Math.random() * template.descriptions.length);
            const amountIndex = Math.floor(Math.random() * template.amounts.length);
            const coinIndex = Math.floor(Math.random() * template.rewards.coin.length);
            const resourceIndex = template.rewards.resource ? 
                Math.floor(Math.random() * template.rewards.resource.length) : 0;
            const amountResourceIndex = template.rewards.amounts ? 
                Math.floor(Math.random() * template.rewards.amounts.length) : 0;
            
            const mission = {
                id: `${type}_${Date.now()}_${i}`,
                name: template.names[nameIndex],
                description: template.descriptions[descIndex].replace('{amount}', template.amounts[amountIndex]),
                type: template.type,
                requirement: {
                    type: template.type,
                    amount: template.amounts[amountIndex],
                    resources: template.type === 'collect' ? ['stone', 'wood', 'fish'] : undefined
                },
                reward: {
                    coin: template.rewards.coin[coinIndex],
                    resource: template.rewards.resource ? template.rewards.resource[resourceIndex] : null,
                    amount: template.rewards.amounts ? template.rewards.amounts[amountResourceIndex] : 1,
                    special: template.rewards.special ? 
                        template.rewards.special[Math.floor(Math.random() * template.rewards.special.length)] : 
                        null
                }
            };
            
            missions.push(mission);
        }
        
        return missions;
    }

    // Verificar si debe resetear
    shouldReset(type) {
        const now = Date.now();
        const lastReset = this.lastReset[type];
        
        // Si nunca se ha resetado, hacerlo ahora
        if (lastReset === 0) return true;
        
        switch(type) {
            case 'daily':
                return (now - lastReset) >= 24 * 60 * 60 * 1000;
            case 'weekly':
                return (now - lastReset) >= 7 * 24 * 60 * 60 * 1000;
            case 'monthly':
                return (now - lastReset) >= 30 * 24 * 60 * 60 * 1000;
            default:
                return false;
        }
    }

    // Obtener misiones actuales
    getMissions(type) {
        this.initializeMissions(); // Verificar y actualizar si es necesario
        return this[`${type}Missions`];
    }
}

// Instancia global del sistema de misiones
export const missionSystem = new MissionSystem();