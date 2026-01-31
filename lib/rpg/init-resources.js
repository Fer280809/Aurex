// ============================================
// lib/rpg/init-resources.js
// ============================================
export function initializeResourceSystem() {
    console.log('🔄 Inicializando sistema de recursos...');
    
    if (!global.db.data.users) {
        global.db.data.users = {};
        console.log('✅ Base de datos de usuarios creada');
    }
    
    // Inicializar usuarios existentes
    Object.values(global.db.data.users).forEach(user => {
        if (!user.inventory) {
            user.inventory = {
                resources: {},
                tools: {
                    pickaxe: 'basic',
                    axe: 'basic',
                    fishingRod: 'basic'
                },
                durability: {
                    pickaxe: 100,
                    axe: 100,
                    fishingRod: 100
                },
                crafted: {},
                missions: {
                    daily: { streak: 0, lastCompleted: 0, completed: [] },
                    weekly: { streak: 0, lastCompleted: 0, completed: [] },
                    monthly: { streak: 0, lastCompleted: 0, completed: [] }
                }
            };
        }
        
        // Inicializar campos de seguimiento diario
        user.minedToday = user.minedToday || 0;
        user.choppedToday = user.choppedToday || 0;
        user.fishedToday = user.fishedToday || 0;
        
        // Inicializar economía básica si no existe
        user.coin = user.coin || 1000;
        user.bank = user.bank || 0;
        user.health = user.health || 100;
    });
    
    console.log('✅ Sistema de recursos inicializado');
}

// Reiniciar estadísticas diarias automáticamente
export function resetDailyStats() {
    const now = new Date();
    const hour = now.getHours();
    
    // Reiniciar a medianoche
    if (hour === 0) {
        Object.values(global.db.data.users).forEach(user => {
            user.minedToday = 0;
            user.choppedToday = 0;
            user.fishedToday = 0;
            
            // Reiniciar misiones diarias si no se completaron
            if (user.inventory?.missions?.daily) {
                const today = new Date().toDateString();
                if (user.inventory.missions.daily.lastCompleted !== today) {
                    user.inventory.missions.daily.completed = [];
                }
            }
        });
        console.log('🔄 Estadísticas diarias reiniciadas');
    }
}

// Programar reinicio diario
setInterval(resetDailyStats, 60 * 60 * 1000);