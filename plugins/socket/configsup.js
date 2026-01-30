import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

const handler = async (m, { conn, usedPrefix, command, text, args }) => {
  // Solo para SubBots
  if (conn.user.jid === global.conn.user.jid) {
    return m.reply('❌ Este comando solo funciona en SubBots.')
  }

  const sessionId = conn.user.jid.split('@')[0]
  const configPath = path.join(global.jadi, sessionId, 'config.json')
  const logoPath = path.join(global.jadi, sessionId, 'logo.jpg')
  const logoUrlPath = path.join(global.jadi, sessionId, 'logo_url.txt')

  // Cargar o crear configuración
  let config = {}
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  }

  // Verificar permisos
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
      'Logo': config.logoUrl ? '✅ URL' : (config.logo ? '✅ Local' : '🌐 Global'),
      'Dueño': config.owner ? `@${config.owner.split('@')[0]}` : 'No definido',
      'Creado': config.createdAt ? new Date(config.createdAt).toLocaleString() : 'Reciente'
    }

    let message = `⚙️ *CONFIGURACIÓN DEL SUBBOT*\n\n`
    for (const [key, val] of Object.entries(currentConfig)) {
      message += `• *${key}:* ${val}\n`
    }

    if (config.logoUrl) {
      message += `• *URL Logo:* ${config.logoUrl.substring(0, 30)}...\n`
    }

    message += `\n📝 *Comandos de configuración:*\n`
    message += `└ ${usedPrefix}config prefix <nuevo> - Cambiar prefijo\n`
    message += `└ ${usedPrefix}config name <nombre> - Cambiar nombre\n`
    message += `└ ${usedPrefix}config mode <public/private> - Cambiar modo\n`
    message += `└ ${usedPrefix}config antiprivate <on/off> - Anti mensajes privados\n`
    message += `└ ${usedPrefix}config gponly <on/off> - Solo grupos\n`
    message += `└ ${usedPrefix}config logo - Cambiar logo (responder a imagen)\n`
    message += `└ ${usedPrefix}config logourl <url> - Establecer logo desde URL\n`
    message += `└ ${usedPrefix}config resetlogo - Restablecer logo al global\n`
    message += `└ ${usedPrefix}config restart - Reiniciar SubBot\n`
    message += `└ ${usedPrefix}config reset - Restablecer configuración\n`

    await conn.sendMessage(m.chat, { 
      text: message,
      mentions: config.owner ? [config.owner] : []
    }, { quoted: m })
    return
  }

  // Procesar acciones
  switch (action.toLowerCase()) {
    case 'prefix': {
      if (!value) return m.reply(`⚠️ Uso: ${usedPrefix}config prefix <nuevo prefijo>`)
      if (value.length > 5) return m.reply('❌ El prefijo no puede tener más de 5 caracteres.')

      const oldPrefix = config.prefix || global.prefix
      config.prefix = value

      // Actualizar en el socket
      conn.subConfig = conn.subConfig || {}
      conn.subConfig.prefix = value

      await saveConfig(configPath, config)
      return m.reply(`✅ Prefijo cambiado:\nDe: \`${oldPrefix}\`\nA: \`${value}\``)
    }

    case 'name': {
      if (!value) return m.reply(`⚠️ Uso: ${usedPrefix}config name <nuevo nombre>`)
      if (value.length > 30) return m.reply('❌ El nombre no puede tener más de 30 caracteres.')

      const oldName = config.name || conn.user.name
      config.name = value

      // Actualizar en el socket
      conn.subConfig = conn.subConfig || {}
      conn.subConfig.name = value

      await saveConfig(configPath, config)
      return m.reply(`✅ Nombre cambiado:\nDe: *${oldName}*\nA: *${value}*`)
    }

    case 'mode': {
      if (!value) return m.reply(`⚠️ Uso: ${usedPrefix}config mode <public/private>`)

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

      await saveConfig(configPath, config)
      return m.reply(`✅ Modo cambiado a: *${mode}*`)
    }

    case 'antiprivate': {
      const state = value?.toLowerCase()
      if (!state || !['on', 'off'].includes(state)) {
        return m.reply(`⚠️ Uso: ${usedPrefix}config antiprivate <on/off>`)
      }

      config.antiPrivate = state === 'on'

      // Actualizar en settings
      if (!global.db.data.settings[conn.user.jid]) {
        global.db.data.settings[conn.user.jid] = {}
      }
      global.db.data.settings[conn.user.jid].antiPrivate = state === 'on'

      await saveConfig(configPath, config)
      return m.reply(`✅ Anti-Private ${state === 'on' ? 'activado' : 'desactivado'}`)
    }

    case 'gponly': {
      const state = value?.toLowerCase()
      if (!state || !['on', 'off'].includes(state)) {
        return m.reply(`⚠️ Uso: ${usedPrefix}config gponly <on/off>`)
      }

      config.gponly = state === 'on'

      // Actualizar en settings
      if (!global.db.data.settings[conn.user.jid]) {
        global.db.data.settings[conn.user.jid] = {}
      }
      global.db.data.settings[conn.user.jid].gponly = state === 'on'

      await saveConfig(configPath, config)
      return m.reply(`✅ Solo-Grupos ${state === 'on' ? 'activado' : 'desactivado'}`)
    }

    case 'logo': {
      // Verificar si hay imagen
      const quoted = m.quoted || m
      if (!quoted || !quoted.mtype || !quoted.mtype.includes('image')) {
        return m.reply(`⚠️ Responde a una imagen para establecer como logo.\n\nTambién puedes usar: ${usedPrefix}config logourl <url>`)
      }

      try {
        await m.reply('📥 Descargando imagen...')
        
        // Crear directorio si no existe
        const dirPath = path.dirname(logoPath)
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true })
        }
        
        // Descargar imagen
        const buffer = await quoted.download()
        
        // Guardar archivo
        fs.writeFileSync(logoPath, buffer)
        
        // Actualizar configuración
        config.logo = logoPath
        delete config.logoUrl // Eliminar URL si existía
        
        await saveConfig(configPath, config)
        
        // Actualizar en memoria
        conn.subConfig = conn.subConfig || {}
        conn.subConfig.logo = logoPath
        delete conn.subConfig.logoUrl
        
        // Enviar confirmación con preview
        await conn.sendMessage(m.chat, {
          image: buffer,
          caption: '✅ Logo actualizado correctamente para este SubBot\n\n*Tipo:* Imagen local'
        }, { quoted: m })
        
      } catch (error) {
        console.error(error)
        return m.reply('❌ Error al procesar la imagen. Asegúrate de que sea una imagen válida.')
      }
      break
    }

    case 'logourl': {
      if (!value) {
        return m.reply(`⚠️ Uso: ${usedPrefix}config logourl <url>\n\nEjemplo: ${usedPrefix}config logourl https://ejemplo.com/logo.jpg`)
      }

      try {
        // Validar URL
        if (!value.startsWith('http')) {
          return m.reply('❌ URL inválida. Debe comenzar con http:// o https://')
        }

        await m.reply('📥 Descargando imagen desde URL...')

        // Descargar imagen desde URL
        const response = await fetch(value)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const buffer = await response.buffer()
        
        // Verificar que sea una imagen
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.startsWith('image/')) {
          return m.reply('❌ La URL no apunta a una imagen válida.')
        }

        // Crear directorio si no existe
        const dirPath = path.dirname(logoPath)
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true })
        }

        // Guardar localmente también
        fs.writeFileSync(logoPath, buffer)
        
        // Guardar URL en configuración
        config.logoUrl = value
        config.logo = logoPath // También guardar referencia local
        
        await saveConfig(configPath, config)

        // Actualizar en memoria
        conn.subConfig = conn.subConfig || {}
        conn.subConfig.logoUrl = value
        conn.subConfig.logo = logoPath

        // Enviar confirmación con preview
        await conn.sendMessage(m.chat, {
          image: buffer,
          caption: `✅ Logo desde URL actualizado\n\n*URL:* ${value.substring(0, 50)}...\n*Tipo:* ${contentType}`
        }, { quoted: m })

      } catch (error) {
        console.error(error)
        return m.reply(`❌ Error al descargar la imagen:\n${error.message}`)
      }
      break
    }

    case 'resetlogo': {
      // Eliminar logo personalizado
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath)
      }
      
      if (fs.existsSync(logoUrlPath)) {
        fs.unlinkSync(logoUrlPath)
      }
      
      // Limpiar referencias en config
      delete config.logo
      delete config.logoUrl
      
      await saveConfig(configPath, config)
      
      // Actualizar en memoria
      if (conn.subConfig) {
        delete conn.subConfig.logo
        delete conn.subConfig.logoUrl
      }
      
      return m.reply('✅ Logo restablecido al logo global.')
    }

    case 'restart': {
      // Guardar el chat donde se solicitó el reinicio
      const restartChat = m.chat
      
      // Enviar mensaje de confirmación ANTES de cerrar la conexión
      await m.reply('🔄 Reiniciando SubBot... Esto tomará unos segundos.')
      
      // Usar setTimeout para dar tiempo al mensaje de enviarse
      setTimeout(async () => {
        try {
          // Cerrar la conexión del SubBot
          if (conn.ws && conn.ws.readyState !== 3) { // 3 = CLOSED
            conn.ws.close()
          }
          
          // Si tienes un sistema de reconexión automática, esto debería reconectar solo
          console.log(`🔄 SubBot ${conn.user.jid} reiniciado por solicitud`)
          
        } catch (error) {
          console.error('Error al reiniciar SubBot:', error)
        }
      }, 2000) // Esperar 2 segundos antes de cerrar
      break
    }

    case 'reset': {
      // Restablecer configuración
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

      // Eliminar logo personalizado si existe
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath)
      }
      
      if (fs.existsSync(logoUrlPath)) {
        fs.unlinkSync(logoUrlPath)
      }

      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))

      // Actualizar en memoria
      conn.subConfig = defaultConfig

      return m.reply('✅ Configuración restablecida a valores por defecto.')
    }

    default: {
      return m.reply(`❌ Acción no reconocida.\nUsa ${usedPrefix}config para ver opciones.`)
    }
  }
}

// Función para guardar configuración
async function saveConfig(path, config) {
  config.updatedAt = new Date().toISOString()
  fs.writeFileSync(path, JSON.stringify(config, null, 2))

  // Actualizar en memoria global
  if (global.subBotsData) {
    global.subBotsData.set(path, config)
  }
}

// Función para obtener el logo del SubBot
export async function getSubBotLogo(conn) {
  try {
    if (conn.subConfig) {
      // Si tiene URL de logo
      if (conn.subConfig.logoUrl) {
        const response = await fetch(conn.subConfig.logoUrl)
        if (response.ok) {
          return await response.buffer()
        }
      }
      
      // Si tiene logo local
      if (conn.subConfig.logo && fs.existsSync(conn.subConfig.logo)) {
        return fs.readFileSync(conn.subConfig.logo)
      }
    }
    
    // Si no hay logo personalizado, usar el global
    if (global.icono && global.icono.startsWith('http')) {
      const response = await fetch(global.icono)
      if (response.ok) {
        return await response.buffer()
      }
    }
    
    // Usar el catalogo global como fallback
    return global.catalogo || Buffer.alloc(0)
  } catch (error) {
    console.error('Error obteniendo logo:', error)
    return global.catalogo || Buffer.alloc(0)
  }
}

handler.help = ['config', 'configsub']
handler.tags = ['subbot']
handler.command = ['config', 'configsub']
handler.premium = false
handler.group = false
handler.private = false

export default handler