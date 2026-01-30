import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import fs from "fs"

// ============= CONFIGURACIÓN DE SUBS =============
global.supConfig = {
  maxSubBots: 100,
  sessionTime: 45,
  cooldown: 120,
  autoClean: true,
  folder: "Sessions/SubBot",
}

global.subBotsData = new Map()

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
global.vs = "1.3"
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

// URLs (usa raw.githubusercontent.com para imágenes)
global.banner = "https://raw.githubusercontent.com/Fer280809/Asta_bot/main/lib/catalogo.jpg"
global.icono = "https://raw.githubusercontent.com/Fer280809/Asta_bot/main/lib/catalogo.jpg"
global.catalogo = fs.readFileSync('./lib/catalogo.jpg')

// ============= REDES =============
global.group = "https://chat.whatsapp.com/BfCKeP10yZZ9ancsGy1Eh9"
global.community = "https://chat.whatsapp.com/KKwDZn5vDAE6MhZFAcVQeO"
global.channel = "https://whatsapp.com/channel/0029Vb64nWqLo4hb8cuxe23n"
global.github = "https://github.com/Fer280809/Asta-bot"
global.gmail = "fer2809fl@gmail.com"
global.ch = {
  ch1: "120363399175402285@newsletter"
}

// ============= APIS =============
global.APIs = {
  xyro: { url: "https://xyro.site", key: null },
  yupra: { url: "https://api.yupra.my.id", key: null },
  vreden: { url: "https://api.vreden.web.id", key: null },
  delirius: { url: "https://api.delirius.store", key: null },
  zenzxz: { url: "https://api.zenzxz.my.id", key: null },
  siputzx: { url: "https://api.siputzx.my.id", key: null },
  adonix: { url: "https://api-adonix.ultraplus.click", key: 'Destroy-xyz' }
}

// ============= WATCH FILE =============
let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("✅ Settings.js actualizado"))
  import(`${file}?update=${Date.now()}`)
})