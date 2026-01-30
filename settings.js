
import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import fs from "fs"

// ============= CONFIGURACIÓN MEJORADA DE SUBS =============
global.supConfig = {
  maxSubBots: 100,
  sessionTime: 60, // Aumentado a 60 minutos
  cooldown: 30, // Reducido a 30 segundos
  autoClean: true,
  autoRestart: true, // Nueva función: reinicio automático
  persistentSessions: true, // Nueva: sesiones persistentes
  folder: "Sessions/SubBot",
}

global.subBotsData = new Map()
global.activeSubBots = new Map() // Para rastrear SubBots activos
global.pendingRestarts = new Set() // Para reinicios pendientes

// ============= PROPIETARIOS =============
global.owner = [
  "5214183357841",
  "5356795360",
  "573502523837",
  "573153057295"
]

global.suittag = ["5214183357841"] 
global.prems = ["5214183357841"]
global.fernando = ["5214183357841"]

// ============= CONFIGURACIÓN DEL BOT =============
global.libreria = "Baileys Multi Device"
global.vs = "1.4" // Versión actualizada
global.nameqr = "ᴀsᴛᴀ-ʙᴏᴛ"
global.sessions = "Sessions/Principal"
global.jadi = "Sessions/SubBot"
global.AstaJadibts = true

// ============= PREFIJOS =============
global.prefix = new RegExp('^[#!./-]?')
global.sinprefix = true

// ============= PERSONALIZACIÓN =============
global.botname = "ᴀsᴛᴀ-ʙᴏᴛ"
global.textbot = "ᴀsᴛᴀ-ʙᴏᴛ • Powered By ғᴇʀɴᴀɴᴅᴏ"
global.dev = "Powered By ғᴇʀɴᴀɴᴅᴏ"
global.author = "ᴀsᴛᴀ-ʙᴏᴛ • Powered By ғᴇʀɴᴀɴᴅᴏ"
global.etiqueta = "ғᴇʀɴᴀɴᴅᴏ"
global.currency = "¥enes"

// URLs
global.banner = "https://raw.githubusercontent.com/Fer280809/Asta_bot/main/lib/catalogo.jpg"
global.icono = "https://raw.githubusercontent.com/Fer280809/Asta_bot/main/lib/catalogo.jpg"
global.catalogo = fs.readFileSync('./lib/catalogo.jpg')

// ============= FUNCIÓN PARA REINICIAR SUBS =============
global.restartAllSubBots = async function() {
  console.log(chalk.cyan('🔄 Reiniciando todos los SubBots...'))
  
  for (const [jid, subBot] of global.activeSubBots) {
    try {
      if (subBot.ws && subBot.ws.readyState !== 3) {
        // Guardar configuración antes de cerrar
        await saveSubBotState(subBot)
        subBot.ws.close()
        
        // Programar reconexión
        setTimeout(() => {
          reconnectSubBot(jid)
        }, 3000)
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error reiniciando SubBot ${jid}:`, error))
    }
  }
  
  console.log(chalk.green('✅ Reinicio de SubBots programado'))
}

// Función para reconectar SubBot
async function reconnectSubBot(jid) {
  const subBotPath = path.join(global.jadi, jid.split('@')[0])
  
  if (!fs.existsSync(subBotPath)) {
    console.log(chalk.yellow(`⚠️ No hay sesión guardada para ${jid}`))
    return
  }
  
  // Aquí iría la lógica de reconexión automática
  // (similar a la de AstaJadiBot pero sin requerir QR)
  console.log(chalk.blue(`🔗 Reconectando SubBot ${jid}...`))
}

// ============= WATCH FILE =============
let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("✅ Settings.js actualizado"))
  
  // Reiniciar SubBots si la configuración cambia
  if (global.supConfig.autoRestart) {
    setTimeout(() => {
      global.restartAllSubBots()
    }, 5000)
  }
  
  import(`${file}?update=${Date.now()}`)
})