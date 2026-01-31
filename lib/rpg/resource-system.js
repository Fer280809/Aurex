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
                names: ['Minero Novato', 'Excavador', 'Buscador de Piedras', 'Picapedrero'],
                descriptions: ['Mina {amount} recursos', 'Excava {amount} minerales', 'Busca {amount} piedras'],
                amounts: [5, 10, 15, 20],
                rewards: { coin: [200, 500, 800], resource: ['stone', 'iron'] }
            },
            {
                type: 'chop',
                names: ['Leñador', 'Talador', 'Cortador de Árboles', 'Forestal'],
                descriptions: ['Tala {amount} recursos', 'Corta {amount} árboles', 'Recoge {amount} maderas'],
                amounts: [8, 12, 16, 25],
                rewards: { coin: [150, 300, 450], resource: ['wood', 'oak'] }
            },
            {
                type: 'fish',
                names: ['Pescador', 'Pescador de Ríos', 'Cazador de Peces', 'Marinero'],
                descriptions: ['Pesca {amount} recursos', 'Atrapa {amount} peces', 'Captura {amount} criaturas marinas'],
                amounts: [4, 6, 10, 15],
                rewards: { coin: [250, 400, 600], resource: ['fish', 'salmon'] }
            },
            {
                type: 'craft',
                names: ['Artesano', 'Creador', 'Forjador', 'Constructor'],
                descriptions: ['Craftea {amount} item', 'Crea {amount} objeto', 'Fabrica {amount} herramienta'],
                amounts: [1, 2, 3],
                rewards: { coin: [300, 600, 900], resource: ['gold', 'iron'] }
            },
            {
                type: 'sell',
                names: ['Comerciante', 'Vendedor', 'Mercader', 'Negociante'],
                descriptions: ['Vende {amount} recursos', 'Comercializa {amount} items', 'Intercambia {amount} materiales'],
                amounts: [10, 20, 30, 50],
                rewards: { coin: [400, 700, 1000], resource: ['gold', 'diamond'] }
            }
        ],
        weekly: [
            {
                type: 'collect',
                names: ['Coleccionista', 'Recolector', 'Acumulador', 'Atesorador'],
                descriptions: ['Consigue {amount} de cada recurso básico', 'Acumula {amount} recursos variados', 'Recolecta {amount} materiales diferentes'],
                amounts: [30, 50, 75, 100],
                rewards: { coin: [2000, 5000, 8000], resource: ['diamond', 'emerald'] }
            },
            {
                type: 'craft_diverse',
                names: ['Maestro Artesano', 'Experto Creador', 'Forjador Maestro', 'Constructor Supremo'],
                descriptions: ['Craftea {amount} items diferentes', 'Crea {amount} objetos únicos', 'Fabrica {amount} herramientas distintas'],
                amounts: [3, 5, 8],
                rewards: { coin: [3000, 6000, 9000], special: ['diamond_pickaxe', 'diamond_axe'] }
            },
            {
                type: 'upgrade',
                names: ['Mejorador', 'Ascensor', 'Evolucionador', 'Perfeccionador'],
                descriptions: ['Mejora {amount} herramientas', 'Asciende {amount} equipos', 'Evoluciona {amount} instrumentos'],
                amounts: [1, 2, 3],
                rewards: { coin: [4000, 7000, 10000], resource: ['mythril'] }
            }
        ],
        monthly: [
            {
                type: 'total_resources',
                names: ['Leyenda', 'Mito', 'Épico', 'Legendario'],
                descriptions: ['Consigue {amount} recursos en total', 'Acumula {amount} materiales', 'Reúne {amount} elementos'],
                amounts: [500, 1000, 2000, 5000],
                rewards: { coin: [10000, 25000, 50000], special: ['legendary_character', 'mythril_set'] }
            },
            {
                type: 'bank',
                names: ['Magnate', 'Millonario', 'Acaudalado', 'Rico'],
                descriptions: ['Acumula ¥{amount} en el banco', 'Ahorra ¥{amount}', 'Guarda ¥{amount}'],
                amounts: [50000, 100000, 250000, 500000],
                rewards: { coin: [15000, 30000, 60000], special: ['exclusive_character', 'premium_tools'] }
            },
            {
                type: 'complete_all',
                names: ['Perfeccionista', 'Completista', 'Terminador', 'Finalizador'],
                descriptions: ['Completa todas las misiones diarias por {amount} días', 'Termina todas las tareas diarias {amount} veces'],
                amounts: [7, 14, 30],
                rewards: { coin: [20000, 40000, 80000], special: ['unique_character', 'legendary_set'] }
            }
        ]
    };

    // Inicializar misiones aleatorias
    initializeMissions() {
        const now = Date.now();
        const today = new Date().toDateString();
        
        // Generar nuevas misiones diarias si es un nuevo día
        if (this.shouldReset('daily')) {
            this.dailyMissions = this.generateRandomMissions('daily', 3);
            this.lastReset.daily = now;
        }
        
        // Generar nuevas misiones semanales si es nueva semana
        if (this.shouldReset('weekly')) {
            this.weeklyMissions = this.generateRandomMissions('weekly', 2);
            this.lastReset.weekly = now;
        }
        
        // Generar nuevas misiones mensuales si es nuevo mes
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
            
            const mission = {
                id: `${type}_mission_${Date.now()}_${i}`,
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
                    resource: template.rewards.resource ? 
                        template.rewards.resource[Math.floor(Math.random() * template.rewards.resource.length)] : 
                        null,
                    amount: template.type === 'collect' ? 3 : Math.floor(Math.random() * 5) + 1,
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
        
        switch(type) {
            case 'daily':
                // Verificar si ha pasado un día
                return (now - lastReset) >= 24 * 60 * 60 * 1000;
            case 'weekly':
                // Verificar si ha pasado una semana
                return (now - lastReset) >= 7 * 24 * 60 * 60 * 1000;
            case 'monthly':
                // Verificar si ha pasado un mes (aprox 30 días)
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

    // Verificar si misión está completada
    checkMissionCompletion(user, mission) {
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
            case 'collect':
                return mission.requirement.resources.every(res => 
                    (user.inventory?.resources?.[res] || 0) >= mission.requirement.amount
                );
            case 'bank':
                return (user.bank || 0) >= mission.requirement.amount;
            case 'complete_all':
                const streak = user.inventory?.missions?.daily?.streak || 0;
                return streak >= mission.requirement.amount;
            default:
                return false;
        }
    }

    // Generar ID único para misiones
    generateMissionId(type, index) {
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${type}_${year}${month}${day}_${index}`;
    }
}

// Instancia global del sistema de misiones
export const missionSystem = new MissionSystem();