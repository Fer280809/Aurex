import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import fs from "fs"

// Configuración del bot principal
global.botNumber = ""
global.owner = ["5214183357841", "5356795360", "573502523837", "573153057295"]
global.suittag = ["5214183357841"]
global.prems = ["5214183357841"]
global.fernando = ["5214183357841"]

// Bot info - ESTO ES LO QUE SE PUEDE EDITAR EN CADA SUBBOT
global.libreria = "Baileys Multi Device"
global.vs = "^1.3"
global.nameqr = "Asta-Bot"
global.sessions = "Sessions/Principal"
global.jadi = "Sessions/SubBot"
global.AstaJadibts = true

// Prefijos
global.prefix = new RegExp('^[#!./-]?')
global.sinprefix = true

// Personalización - BASE para sub-bots
global.botname = "Asta-Bot"
global.textbot = "Asta-Bot • Powered By Fernando"
global.dev = "Powered By Fernando"
global.author = "Asta-Bot • Powered By Fernando"
global.etiqueta = "Fernando"
global.currency = "¥enes"
global.banner = "https://raw.githubusercontent.com/Fer280809/Asta_bot/main/lib/catalogo.jpg"
global.icono = "https://raw.githubusercontent.com/Fer280809/Asta_bot/main/lib/catalogo.jpg"
global.catalogo = fs.readFileSync('./lib/catalogo.jpg')

// Enlaces
global.group = "https://chat.whatsapp.com/BfCKeP10yZZ9ancsGy1Eh9"
global.community = "https://chat.whatsapp.com/KKwDZn5vDAE6MhZFAcVQeO"
global.channel = "https://whatsapp.com/channel/0029Vb64nWqLo4hb8cuxe23n"
global.github = "https://github.com/Fer280809/Asta-bot"
global.gmail = "fer2809fl@gmail.com"
global.ch = { ch1: "120363399175402285@newsletter" }

// APIs
global.APIs = {
  xyro: { url: "https://xyro.site", key: null },
  yupra: { url: "https://api.yupra.my.id", key: null },
  vreden: { url: "https://api.vreden.web.id", key: null },
  delirius: { url: "https://api.delirius.store", key: null },
  zenzxz: { url: "https://api.zenzxz.my.id", key: null },
  siputzx: { url: "https://api.siputzx.my.id", key: null },
  adonix: { url: "https://api-adonix.ultraplus.click", key: 'Destroy-xyz' }
}

// SISTEMA DE CONFIGURACIÓN PARA SUB-BOTS
global.subBotConfigs = {} // Aquí se guardan las configs de cada sub-bot

// Configuración por defecto (usa los valores globales)
global.getSubBotConfig = (jid) => {
  if (global.subBotConfigs[jid]) {
    return global.subBotConfigs[jid]
  }
  
  // Valores por defecto basados en los globales
  const defaultConfig = {
    name: global.botname,
    logo: global.icono,
    banner: global.banner,
    prefix: ["!", ".", "#", "/"],
    sinprefix: global.sinprefix,
    customStatus: "Disponible ⚡",
    autoresponder: false,
    created: new Date().toISOString(),
    jid: jid
  }
  
  global.subBotConfigs[jid] = defaultConfig
  return defaultConfig
}

// Actualizar configuración
global.updateSubBotConfig = (jid, updates) => {
  const current = global.getSubBotConfig(jid)
  global.subBotConfigs[jid] = {
    ...current,
    ...updates,
    lastUpdate: new Date().toISOString()
  }
  return global.subBotConfigs[jid]
}

// Watch para recargar
let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'settings.js'"))
  import(`${file}?update=${Date.now()}`)
})