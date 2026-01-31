
// ============================================
// lib/rpg/mission-system.js
// ============================================
export class MissionSystem {
    constructor() {
        this.dailyMissions = [];
        this.weeklyMissions = [];
        this.monthlyMissions = [];
        this.lastReset = { daily: 0, weekly: 0, monthly: 0 };
        this.initializeMissions();
    }

    // Bancos de posibles misiones
    missionTemplates = {
        daily: [
            {
                type: 'mine',
                names: ['Minero Novato'],
                descriptions: ['Mina {amount} recursos'],
                amounts: [10],
                rewards: { coin: [500], resource: ['stone'] }
            },
            {
                type: 'chop',
                names: ['Leñador'],
                descriptions: ['Tala {amount} recursos'],
                amounts: [15],
                rewards: { coin: [300], resource: ['wood'] }
            },
            {
                type: 'fish',
                names: ['Pescador'],
                descriptions: ['Pesca {amount} recursos'],
                amounts: [8],
                rewards: { coin: [400], resource: ['fish'] }
            }
        ]
    };

    // Inicializar misiones aleatorias
    initializeMissions() {
        const now = Date.now();
        
        // Generar nuevas misiones diarias si es un nuevo día
        if (this.shouldReset('daily')) {
            this.dailyMissions = this.generateRandomMissions('daily', 3);
            this.lastReset.daily = now;
        }
    }

    // Generar misiones aleatorias
    generateRandomMissions(type, count) {
        const templates = this.missionTemplates[type];
        const missions = [];
        
        for (let i = 0; i < count; i++) {
            const template = templates[Math.floor(Math.random() * templates.length)];
            const mission = {
                id: `${type}_${Date.now()}_${i}`,
                name: template.names[0],
                description: template.descriptions[0].replace('{amount}', template.amounts[0]),
                type: template.type,
                requirement: { type: template.type, amount: template.amounts[0] },
                reward: { coin: template.rewards.coin[0], resource: template.rewards.resource[0] }
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
                // Verificar si ha pasado un día
                return (now - lastReset) >= 24 * 60 * 60 * 1000;
            case 'weekly':
                // Verificar si ha pasado una semana
                return (now - lastReset) >= 7 * 24 * 60 * 60 * 1000;
            case 'monthly':
                // Verificar si ha pasado un mes
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
            default:
                return false;
        }
    }
}

// Instancia global del sistema de misiones
export const missionSystem = new MissionSystem();