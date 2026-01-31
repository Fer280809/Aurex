// En la sección de VENDER RECURSOS, agrega esto:

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

// En la sección de vender específico, agrega tracking:
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
    
    // Agregar al tracking diario de ventas
    user.soldToday = (user.soldToday || 0) + amount;
    
    if (user.inventory.resources[item] <= 0) {
        delete user.inventory.resources[item];
    }
    
    await m.reply(`💰 Has vendido ${amount} ${item} por ¥${totalValue.toLocaleString()}`);
    return;
}