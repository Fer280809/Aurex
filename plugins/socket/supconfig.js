import fs from 'fs'
import path from 'path'

const handler = async (m, { conn, usedPrefix, command, text, args }) => {
  // Solo para SubBots
  if (conn.user.jid === global.conn.user.jid) {
    return m.reply('❌ Este comando solo funciona en SubBots.')
  }

  const sessionId = conn.user.jid.split('@')[0]
  const configPath = path.join(global.jadi, sessionId, 'config.json')
  
  // Cargar o crear configuración
  let config = {}
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } else {
    // Crear configuración por defecto
    config = {
      name: `SubBot ${sessionId}`,
      prefix: global.prefix,
      mode: 'public',
      antiPrivate: false,
      gponly: false,
      owner: m.sender,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  }
  
  // Verificar permisos - Solo el dueño puede configurar
  const isOwner = config.owner === m.sender
  const isFernando = global.fernando
    .map(v => v.replace(/\D/g, "") + "@s.whatsapp.net")
    .includes(m.sender)
  
  if (!isOwner && !isFernando) {
    return m.reply('❌ Solo el dueño de este SubBot puede configurarlo.')
  }
  
  const [action, ...values] = args
  const value = values.join(' ')
  
  if (!action) {
    // Mostrar configuración actual
    const currentConfig = {
      'Nombre': config.name || conn.user.name || 'SubBot',
      'Prefijo': config.prefix || global.prefix,
      'Modo': config.mode || 'public',
      'Anti-Private': config.antiPrivate ? '✅ Activado' : '❌ Desactivado',
      'Solo Grupos': config.gponly ? '✅ Activado' : '❌ Desactivado',
      'Dueño': config.owner ? `@${config.owner.split('@')[0]}` : 'No definido',
      'Creado': config.createdAt ? new Date(config.createdAt).toLocaleString() : 'Reciente'
    }
    
    let message = `⚙️ *CONFIGURACIÓN DEL SUBBOT*\n\n`
    for (const [key, val] of Object.entries(currentConfig)) {
      message += `• *${key}:* ${val}\n`
    }
    
    message += `\n📝 *Comandos de configuración:*\n`
    message += `└ ${usedPrefix}subconfig prefix <nuevo> - Cambiar prefijo\n`
    message += `└ ${usedPrefix}subconfig name <nombre> - Cambiar nombre\n`
    message += `└ ${usedPrefix}subconfig mode <public/private> - Cambiar modo\n`
    message += `└ ${usedPrefix}subconfig antiprivate <on/off> - Anti privado\n`
    message += `└ ${usedPrefix}subconfig gponly <on/off> - Solo grupos\n`
    message += `└ ${usedPrefix}subconfig reset - Restablecer configuración\n`
    
    await conn.sendMessage(m.chat, { 
      text: message,
      mentions: config.owner ? [config.owner] : []
    }, { quoted: m })
    return
  }
  
  // Procesar acciones
  switch (action.toLowerCase()) {
    case 'prefix': {
      if (!value) return m.reply(`⚠️ Uso: ${usedPrefix}subconfig prefix <nuevo prefijo>`)
      if (value.length > 5) return m.reply('❌ El prefijo no puede tener más de 5 caracteres.')
      
      const oldPrefix = config.prefix || global.prefix
      config.prefix = value
      
      // Actualizar en el socket
      conn.subConfig = conn.subConfig || {}
      conn.subConfig.prefix = value
      
      config.updatedAt = new Date().toISOString()
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      
      return m.reply(`✅ Prefijo cambiado:\nDe: \`${oldPrefix}\`\nA: \`${value}\``)
    }
    
    case 'name': {
      if (!value) return m.reply(`⚠️ Uso: ${usedPrefix}subconfig name <nuevo nombre>`)
      if (value.length > 30) return m.reply('❌ El nombre no puede tener más de 30 caracteres.')
      
      const oldName = config.name || conn.user.name
      config.name = value
      
      // Actualizar en el socket
      conn.subConfig = conn.subConfig || {}
      conn.subConfig.name = value
      
      config.updatedAt = new Date().toISOString()
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      
      return m.reply(`✅ Nombre cambiado:\nDe: *${oldName}*\nA: *${value}*`)
    }
    
    case 'mode': {
      if (!value) return m.reply(`⚠️ Uso: ${usedPrefix}subconfig mode <public/private>`)
      
      const mode = value.toLowerCase()
      if (!['public', 'private'].includes(mode)) {
        return m.reply('❌ Modos válidos: public, private')
      }
      
      config.mode = mode
      
      // Actualizar en settings
      if (!global.db.data.settings[conn.user.jid]) {
        global.db.data.settings[conn.user.jid] = {}
      }
      global.db.data.settings[conn.user.jid].self = mode === 'private'
      
      config.updatedAt = new Date().toISOString()
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      
      return m.reply(`✅ Modo cambiado a: *${mode}*`)
    }
    
    case 'antiprivate': {
      const state = value?.toLowerCase()
      if (!state || !['on', 'off'].includes(state)) {
        return m.reply(`⚠️ Uso: ${usedPrefix}subconfig antiprivate <on/off>`)
      }
      
      config.antiPrivate = state === 'on'
      
      // Actualizar en settings
      if (!global.db.data.settings[conn.user.jid]) {
        global.db.data.settings[conn.user.jid] = {}
      }
      global.db.data.settings[conn.user.jid].antiPrivate = state === 'on'
      
      config.updatedAt = new Date().toISOString()
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      
      return m.reply(`✅ Anti-Private ${state === 'on' ? 'activado' : 'desactivado'}`)
    }
    
    case 'gponly': {
      const state = value?.toLowerCase()
      if (!state || !['on', 'off'].includes(state)) {
        return m.reply(`⚠️ Uso: ${usedPrefix}subconfig gponly <on/off>`)
      }
      
      config.gponly = state === 'on'
      
      // Actualizar en settings
      if (!global.db.data.settings[conn.user.jid]) {
        global.db.data.settings[conn.user.jid] = {}
      }
      global.db.data.settings[conn.user.jid].gponly = state === 'on'
      
      config.updatedAt = new Date().toISOString()
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      
      return m.reply(`✅ Solo-Grupos ${state === 'on' ? 'activado' : 'desactivado'}`)
    }
    
    case 'reset': {
      const defaultConfig = {
        name: `SubBot ${sessionId}`,
        prefix: global.prefix,
        mode: 'public',
        antiPrivate: false,
        gponly: false,
        owner: config.owner || m.sender,
        createdAt: config.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
      
      // Actualizar en memoria
      conn.subConfig = defaultConfig
      
      return m.reply('✅ Configuración restablecida a valores por defecto.')
    }
    
    default: {
      return m.reply(`❌ Acción no reconocida.\nUsa ${usedPrefix}subconfig para ver opciones.`)
    }
  }
}

handler.help = ['subconfig']
handler.tags = ['subbot']
handler.command = ['subconfig', 'configsub', 'config']
handler.premium = false
handler.group = false
handler.private = false

export default handler