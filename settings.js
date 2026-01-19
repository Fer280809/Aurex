import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import fs from "fs"


//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

//BETA: Si quiere evitar escribir el nГәmero que serГЎ bot en la consola, agreguГ© desde aquГӯ entonces:
//SГіlo aplica para opciГіn 2 (ser bot con cГіdigo de texto de 8 digitos)
global.botNumber = "" //Ejemplo: 573218138672

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*”Җ*

global.owner = [
"5214183357841",
"5356795360"
]

global.suittag = ["5214183357841"] 
global.prems = ["5214183357841"]
global.fernando = ["5214183357841"]

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.libreria = "Baileys Multi Device"
global.vs = "^1.3"
global.nameqr = "『𝕬𝖘𝖙𝖆-𝕭𝖔𝖙』 "
global.sessions = "Sessions/Principal"
global.jadi = "Sessions/SubBot"
global.AstaJadibts = true

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.prefix = new RegExp('^[#!./-]?')
global.sinprefix = true // true = funciona sin prefijo | false = solo con prefijo

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.botname = "『𝕬𝖘𝖙𝖆-𝕭𝖔𝖙』 "
global.textbot = "『𝕬𝖘𝖙𝖆-𝕭𝖔𝖙』 "
global.dev = "• Powered By 𝕱𝖊𝖗𝖓𝖆𝖓𝖉𝖔"
global.author = "『𝕬𝖘𝖙𝖆-𝕭𝖔𝖙』 • Powered By 𝕱𝖊𝖗𝖓𝖆𝖓𝖉𝖔"
global.etiqueta = "『𝕬𝖘𝖙𝖆-𝕭𝖔𝖙』 "
global.currency = "ВҘenes"
global.banner = "https://github.com/Fer280809/Asta_bot/blob/main/lib%2Fcatalogo.jpg"
global.icono = "https://github.com/Fer280809/Asta_bot/blob/main/lib%2Fcatalogo.jpg"
global.catalogo = fs.readFileSync('./lib/catalogo.jpg')

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.group = "https://chat.whatsapp.com/BfCKeP10yZZ9ancsGy1Eh9"
global.community = "https://chat.whatsapp.com/KKwDZn5vDAE6MhZFAcVQeO"
global.channel = "https://whatsapp.com/channel/0029Vb64nWqLo4hb8cuxe23n"
global.github = "https://github.com/Fer280809/Asta-bot"
global.gmail = "fer2809fl@gmail.com"
global.ch = {
ch1: "120363399175402285@newsletter"
}

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.APIs = {
xyro: { url: "https://xyro.site", key: null },
yupra: { url: "https://api.yupra.my.id", key: null },
vreden: { url: "https://api.vreden.web.id", key: null },
delirius: { url: "https://api.delirius.store", key: null },
zenzxz: { url: "https://api.zenzxz.my.id", key: null },
siputzx: { url: "https://api.siputzx.my.id", key: null },
adonix: { url: "https://api-adonix.ultraplus.click", key: 'Destroy-xyz' }
}

//*======== SISTEMA PREMIUM COMPLETO ========*
global.premiumUsers = [] // Usuarios premium
global.premiumBots = {} // Configuraciones de bots premium
global.premiumConns = [] // Conexiones activas premium

// Características premium
global.premiumFeatures = {
  maxSubBots: 5, // Máximo 5 bots por usuario
  customPrefix: true,
  customBanner: true,
  customIcon: true,
  customName: true,
  customStatus: true,
  customBio: true,
  antiDelete: true,
  antiCall: false,
  antiSpam: true,
  alwaysOnline: true,
  webPanel: true,
  backupAuto: true,
  autoRestart: true,
  prioritySupport: true
}

// URLs por defecto para bots premium
global.defaultConfig = {
  banner: "https://cdn.sockywa.xyz/files/JmRs.jpeg",
  icon: "https://cdn.sockywa.xyz/files/RTnq.jpeg",
  channel: "https://whatsapp.com/channel/0029Vb64nWqLo4hb8cuxe23n",
  github: "https://github.com/Fer280809/Asta-bot",
  group: "https://chat.whatsapp.com/BfCKeP10yZZ9ancsGy1Eh9",
  name: "SubBot Premium",
  prefix: ".",
  status: "✨ Usando Asta Bot Premium",
  bio: "🤖 Bot creado con Asta Bot Premium",
  currency: "ⓐsteroides"
}

// Función para guardar datos premium
global.savePremiumData = function() {
  try {
    const data = {
      premiumUsers: global.premiumUsers,
      premiumBots: global.premiumBots,
      timestamp: new Date().toISOString()
    }
    fs.writeFileSync('./lib/premium-data.json', JSON.stringify(data, null, 2))
  } catch (e) {
    console.error('Error guardando datos premium:', e)
  }
}

// Cargar datos premium si existen
try {
  if (fs.existsSync('./lib/premium-data.json')) {
    const premiumData = JSON.parse(fs.readFileSync('./lib/premium-data.json', 'utf8'))
    global.premiumUsers = premiumData.premiumUsers || []
    global.premiumBots = premiumData.premiumBots || {}
  }
} catch (e) {
  console.error('Error cargando datos premium:', e)
}

// Función para verificar usuario premium
global.isPremiumUser = function(sender) {
  const phone = sender.replace(/\D/g, '')
  return global.premiumUsers.includes(phone) || 
         global.owner.map(v => v.replace(/\D/g, '')).includes(phone)
}

// Función para obtener configuración de bot premium
global.getPremiumBotConfig = function(botPhone) {
  return global.premiumBots[botPhone] || {
    ...global.defaultConfig,
    owner: botPhone,
    created: new Date().toISOString(),
    isPremium: true
  }
}

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
unwatchFile(file)
console.log(chalk.redBright("Update 'settings.js'"))
import(`${file}?update=${Date.now()}`)
})
