// ============================================
// lib/rpg/init-resources.js
// ============================================
import { missionSystem } from './mission-system.js';

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
                    daily: { streak: 0, lastCompleted: 0, completed: [], lastClaimed: {} },
                    weekly: { completed: [], lastClaimed: {} },
                    monthly: { completed: [], lastClaimed: {} }
                }
            };
        }
        
        // Inicializar campos de seguimiento diario
        user.minedToday = user.minedToday || 0;
        user.choppedToday = user.choppedToday || 0;
        user.fishedToday = user.fishedToday || 0;
        user.craftedToday = user.craftedToday || 0;
        user.soldToday = user.soldToday || 0;
        
        // Inicializar economía básica si no existe
        user.coin = user.coin || 1000;
        user.bank = user.bank || 0;
        user.health = user.health || 100;
        
        // Inicializar harem si no existe
        if (!user.harem) {
            user.harem = [];
        }
    });
    
    console.log('✅ Sistema de recursos inicializado');
    console.log('🎯 Sistema de misiones dinámicas activado');
}

// Función para extraer número del JID
function extractNumber(jid) {
    return jid.split('@')[0];
}

// Función para verificar si es owner
export function isOwner(sender) {
    const senderNumber = extractNumber(sender);
    return global.owner && global.owner.includes(senderNumber);
}

// Función para verificar si está en fernando
export function isFernando(sender) {
    const senderNumber = extractNumber(sender);
    return global.fernando && global.fernando.includes(senderNumber);
}

// Reiniciar estadísticas diarias automáticamente
export function resetDailyStats() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Reiniciar a medianoche (00:00)
    if (hour === 0 && minute === 0) {
        Object.values(global.db.data.users).forEach(user => {
            user.minedToday = 0;
            user.choppedToday = 0;
            user.fishedToday = 0;
            user.craftedToday = 0;
            user.soldToday = 0;
            
            // Reiniciar misiones diarias del usuario
            if (user.inventory?.missions?.daily) {
                // Guardar racha actual
                const currentStreak = user.inventory.missions.daily.streak || 0;
                
                // Reiniciar misiones completadas
                user.inventory.missions.daily.completed = [];
                user.inventory.missions.daily.lastClaimed = {};
                
                // Mantener la racha solo si completó misiones ayer
                const today = new Date().toDateString();
                if (user.inventory.missions.daily.lastCompleted === today) {
                    user.inventory.missions.daily.streak = currentStreak;
                } else {
                    user.inventory.missions.daily.streak = 0;
                }
            }
        });
        console.log('🔄 Estadísticas diarias reiniciadas - Nuevas misiones disponibles');
        
        // Actualizar misiones diarias del sistema
        missionSystem.dailyMissions = missionSystem.generateRandomMissions('daily', 3);
        missionSystem.lastReset.daily = Date.now();
    }
    
    // Reiniciar misiones semanales los lunes a las 00:00
    if (now.getDay() === 1 && hour === 0 && minute === 0) {
        console.log('🔄 Reinicio semanal - Nuevas misiones semanales disponibles');
        missionSystem.weeklyMissions = missionSystem.generateRandomMissions('weekly', 2);
        missionSystem.lastReset.weekly = Date.now();
    }
    
    // Reiniciar misiones mensuales el primer día del mes a las 00:00
    if (now.getDate() === 1 && hour === 0 && minute === 0) {
        console.log('🔄 Reinicio mensual - Nuevas misiones mensuales disponibles');
        missionSystem.monthlyMissions = missionSystem.generateRandomMissions('monthly', 2);
        missionSystem.lastReset.monthly = Date.now();
    }
}

// Programar chequeo cada minuto para reinicios precisos
setInterval(resetDailyStats, 60 * 1000);