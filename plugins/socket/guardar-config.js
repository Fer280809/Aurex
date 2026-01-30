import fs from 'fs'
import path from 'path'

// Cargar configuraciones al iniciar
try {
  const sessionsDir = `./${global.jadi}`
  if (fs.existsSync(sessionsDir)) {
    const folders = fs.readdirSync(sessionsDir)
    folders.forEach(folder => {
      const configPath = path.join(sessionsDir, folder, 'config.json')
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
          const jid = `${folder}@s.whatsapp.net`
          global.subBotConfigs[jid] = config
        } catch (e) {}
      }
    })
  }
} catch (e) {}

// Guardar automáticamente cada 3 minutos
setInterval(() => {
  if (global.subBotConfigs) {
    Object.entries(global.subBotConfigs).forEach(([jid, config]) => {
      try {
        const folder = jid.split('@')[0]
        const configPath = `./${global.jadi}/${folder}/config.json`
        const dir = path.dirname(configPath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      } catch (e) {}
    })
  }
}, 180000)

// Exportar funciones útiles
export default {
  saveConfig: (jid) => {
    if (global.subBotConfigs?.[jid]) {
      const folder = jid.split('@')[0]
      const configPath = `./${global.jadi}/${folder}/config.json`
      const dir = path.dirname(configPath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(configPath, JSON.stringify(global.subBotConfigs[jid], null, 2))
    }
  },
  
  deleteConfig: (jid) => {
    delete global.subBotConfigs?.[jid]
    const configPath = `./${global.jadi}/${jid.split('@')[0]}/config.json`
    if (fs.existsSync(configPath)) fs.unlinkSync(configPath)
  }
}