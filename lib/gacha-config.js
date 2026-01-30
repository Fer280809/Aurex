// lib/gacha-config.js
export const GACHA_CONFIG = {
    // PRECIOS EN MONEDAS PRINCIPALES (¥)
    prices: {
        roll: 150,          // Costo por cada /roll
        robAttempt: 500,    // Costo por intentar robar
        renameChar: 100,    // Costo por renombrar personaje
        dailyBonus: 200,    // Bonificación diaria
    },
    
    // PROBABILIDADES
    probabilities: {
        robSuccess: 0.3,    // 30% de éxito en robo
        rareChar: 0.1,      // 10% de personaje raro
        duplicate: 0.05,    // 5% de duplicado
    },
    
    // TIEMPOS DE ESPERA (milisegundos)
    cooldowns: {
        roll: 120000,       // 2 minutos entre rolls
        rob: 21600000,      // 6 horas entre robos
        daily: 86400000,    // 24 horas para bonus
        trade: 300000,      // 5 minutos para aceptar intercambio
    },
    
    // LÍMITES
    limits: {
        maxHarem: 500,      // Máximo personajes
        maxSale: 1000000,   // Precio máximo de venta
        minSale: 50,        // Precio mínimo de venta
    }
};

// Utilidades
export const formatCurrency = (amount) => `¥${amount.toLocaleString()}`;
export const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);