/**
 * ⚙️ PANEL DE CONFIGURACIÓN COMPLETO DEL GRUPO
 * Sistema centralizado de configuración con todas las opciones
 * Basado en AstaBot - Creado por Fernando
 * GitHub: https://github.com/Fer280809/Asta_bot
 */

let handler = async (m, { 
  conn, 
  usedPrefix, 
  command, 
  text, 
  args,
  participants,
  isAdmin,
  isOwner,
  botname,
  vs
}) => {
  try {
    // 🔹 INFORMACIÓN DEL COMANDO
    const comandoInfo = {
      nombre: 'configgrupo',
      version: '3.0',
      autor: 'Fernando',
      descripcion: 'Panel completo de configuración del grupo',
      uso: `${usedPrefix}${command} [opción] [valor]`
    }

    // 🔹 DATOS DEL USUARIO
    const usuario = {
      id: m.sender,
      nombre: m.pushName || 'Usuario',
      tag: `@${m.sender.split('@')[0]}`,
      esAdmin: isAdmin,
      esOwner: isOwner
    }

    // 🔹 DATOS DEL CHAT
    const chat = {
      esGrupo: m.isGroup,
      nombre: m.isGroup ? await conn.getName(m.chat) || 'Grupo' : 'Privado',
      id: m.chat
    }

    // 🔹 VALIDACIONES INICIALES
    if (!chat.esGrupo) {
      return conn.reply(m.chat, '❌ Este comando solo funciona en grupos.', m)
    }

    // 🔹 PROCESAR ARGUMENTOS
    const [opcion, ...valores] = args
    const valor = valores.join(' ')
    
    // Reacción de espera
    await m.react('⏳')

    // 🛠️ CÓDIGO PRINCIPAL
    // Obtener datos del chat desde la base de datos
    const chatData = global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {}
    
    // Configuraciones disponibles
    const configuraciones = {
      // 🎉 BIENVENIDAS/DESPEDIDAS
      'welcome': {
        nombre: 'Sistema de Bienvenidas',
        tipo: 'toggle',
        categoria: 'bienvenidas',
        descripcion: 'Activa/desactiva mensajes de bienvenida y despedida',
        valorActual: chatData.welcome !== false,
        requiere: 'admin'
      },
      's.welcome': {
        nombre: 'Mensaje de Bienvenida',
        tipo: 'text',
        categoria: 'bienvenidas',
        descripcion: 'Personaliza el mensaje de bienvenida (@user, @subject, etc)',
        valorActual: chatData.sWelcome || '🎉 ¡Bienvenido/a al grupo!',
        requiere: 'admin'
      },
      's.bye': {
        nombre: 'Mensaje de Despedida',
        tipo: 'text',
        categoria: 'bienvenidas',
        descripcion: 'Personaliza el mensaje de despedida',
        valorActual: chatData.sBye || '👋 ¡Hasta luego!',
        requiere: 'admin'
      },

      // 🛡️ SEGURIDAD
      'antilink': {
        nombre: 'Anti-Enlaces',
        tipo: 'toggle',
        categoria: 'seguridad',
        descripcion: 'Bloquea enlaces de otros grupos/chats',
        valorActual: chatData.antiLink !== false,
        requiere: 'admin'
      },
      'nsfw': {
        nombre: 'Contenido +18',
        tipo: 'toggle',
        categoria: 'seguridad',
        descripcion: 'Permite o bloquea contenido para adultos',
        valorActual: chatData.nsfw === true,
        requiere: 'admin'
      },
      'detect': {
        nombre: 'Detección Automática',
        tipo: 'toggle',
        categoria: 'seguridad',
        descripcion: 'Detección automática de contenido',
        valorActual: chatData.detect !== false,
        requiere: 'admin'
      },

      // 🤖 BOT
      'economy': {
        nombre: 'Sistema Económico',
        tipo: 'toggle',
        categoria: 'bot',
        descripcion: 'Activa/desactiva la economía del bot',
        valorActual: chatData.economy !== false,
        requiere: 'admin'
      },
      'gacha': {
        nombre: 'Sistema Gacha',
        tipo: 'toggle',
        categoria: 'bot',
        descripcion: 'Activa/desactiva el sistema de gacha',
        valorActual: chatData.gacha !== false,
        requiere: 'admin'
      },
      'primarybot': {
        nombre: 'Bot Principal',
        tipo: 'text',
        categoria: 'bot',
        descripcion: 'Define qué bot responde primero en el grupo',
        valorActual: chatData.primaryBot || 'ninguno',
        requiere: 'owner'
      },

      // 🔧 AVANZADO
      'modoadmin': {
        nombre: 'Modo Solo-Admins',
        tipo: 'toggle',
        categoria: 'avanzado',
        descripcion: 'Solo administradores pueden usar comandos',
        valorActual: chatData.modoadmin === true,
        requiere: 'admin'
      },
      'antiprivate': {
        nombre: 'Anti-Private',
        tipo: 'toggle',
        categoria: 'avanzado',
        descripcion: 'Bloquea mensajes privados al bot',
        valorActual: false, // Se maneja en settings globales
        requiere: 'owner'
      },
      'gponly': {
        nombre: 'Solo-Grupos',
        tipo: 'toggle',
        categoria: 'avanzado',
        descripcion: 'Bot solo funciona en grupos',
        valorActual: false, // Se maneja en settings globales
        requiere: 'owner'
      }
    }

    // 🔹 MOSTRAR PANEL PRINCIPAL SI NO HAY OPCIÓN
    if (!opcion) {
      return await mostrarPanelPrincipal(m, conn, chat, usuario, chatData, configuraciones, usedPrefix, command)
    }

    // 🔹 MANEJAR OPCIONES ESPECIALES
    switch (opcion.toLowerCase()) {
      case 'panel':
      case 'menu':
        return await mostrarPanelPrincipal(m, conn, chat, usuario, chatData, configuraciones, usedPrefix, command)
        
      case 'view':
      case 'ver':
      case 'config':
        return await mostrarConfiguracionCompleta(m, conn, chat, usuario, chatData, configuraciones)
        
      case 'help':
      case 'ayuda':
        return await mostrarAyuda(m, conn, usedPrefix, command, comandoInfo)
        
      case 'reset':
      case 'reiniciar':
        if (!usuario.esAdmin && !usuario.esOwner) {
          return conn.reply(m.chat, '❌ Solo administradores pueden resetear configuraciones.', m)
        }
        
        // Resetear solo configuraciones del grupo (no las globales)
        const configuracionesResetear = ['welcome', 'sWelcome', 'sBye', 'antiLink', 'nsfw', 'detect', 'economy', 'gacha', 'modoadmin']
        configuracionesResetear.forEach(key => {
          if (key in chatData) delete chatData[key]
        })
        
        await conn.reply(m.chat, '✅ Configuraciones del grupo restauradas a valores por defecto.', m)
        await m.react('✅')
        return
        
      case 'backup':
      case 'respaldar':
        if (!usuario.esAdmin && !usuario.esOwner) {
          return conn.reply(m.chat, '❌ Solo administradores pueden generar respaldos.', m)
        }
        
        const backup = {}
        Object.keys(configuraciones).forEach(key => {
          const configKey = key.includes('.') ? key.split('.')[1] : key
          if (chatData[configKey] !== undefined) {
            backup[key] = chatData[configKey]
          }
        })
        
        const backupTexto = JSON.stringify(backup, null, 2)
        await conn.reply(m.chat, 
          `📦 *RESPALDO DE CONFIGURACIÓN*\n\n` +
          `Grupo: ${chat.nombre}\n` +
          `Fecha: ${new Date().toLocaleString()}\n\n` +
          `\`\`\`json\n${backupTexto}\`\`\`\n\n` +
          `💾 *Para restaurar:* Copia este código y úsalo con el comando restore.`, m)
        await m.react('✅')
        return
    }

    // 🔹 MANEJAR CONFIGURACIÓN ESPECÍFICA
    const configKey = opcion.toLowerCase()
    const config = configuraciones[configKey]
    
    if (!config) {
      // Buscar por nombre aproximado
      const configEncontrada = Object.entries(configuraciones).find(([key, cfg]) => 
        cfg.nombre.toLowerCase().includes(opcion.toLowerCase()) || 
        key.toLowerCase().includes(opcion.toLowerCase())
      )
      
      if (configEncontrada) {
        return await manejarConfiguracion(m, conn, chat, usuario, chatData, configEncontrada[0], configEncontrada[1], valor, usedPrefix, command)
      }
      
      return conn.reply(m.chat, 
        `❌ Configuración no encontrada.\n\n` +
        `📋 *Configuraciones disponibles:*\n` +
        Object.keys(configuraciones).map(key => `• ${key}`).join('\n') + '\n\n' +
        `💡 Usa ${usedPrefix}${command} help para ver todas las opciones.`, m)
    }

    // Manejar la configuración específica
    await manejarConfiguracion(m, conn, chat, usuario, chatData, configKey, config, valor, usedPrefix, command)

  } catch (error) {
    console.error(`❌ Error en ${command}:`, error)
    await m.react('❌')
    
    const errorMsg = `
╭━━〔⚠️ ERROR EN CONFIGGRUPO 〕━━╮
┃
┃ 🐛 *Comando:* ${command}
┃ 👤 *Usuario:* @${m.sender.split('@')[0]}
┃ ⏰ *Hora:* ${new Date().toLocaleTimeString()}
┃
┃ 📛 *Error:*
┃ ${error.message}
┃
┃ 🔧 *Solución:*
┃ 1. Verifica que el bot sea administrador
┃ 2. Revisa la sintaxis del comando
┃ 3. Reporta el error con:
┃    ${usedPrefix}report [descripción]
┃
╰━━━━━━━━━━━━━━━━━━━━━╯
    `.trim()
    
    await conn.reply(m.chat, errorMsg, m)
  }
}

// 🎨 FUNCIÓN: Mostrar panel principal
async function mostrarPanelPrincipal(m, conn, chat, usuario, chatData, configuraciones, usedPrefix, command) {
  // Agrupar configuraciones por categoría
  const categorias = {}
  Object.entries(configuraciones).forEach(([key, config]) => {
    if (!categorias[config.categoria]) {
      categorias[config.categoria] = []
    }
    categorias[config.categoria].push({ key, ...config })
  })

  const panel = `
╭━━━━━━〔⚙️ PANEL DE CONFIGURACIÓN 〕━━━━━━╮
┃
┃ 👥 *GRUPO:* ${chat.nombre}
┃ 👤 *USUARIO:* ${usuario.tag}
┃ 📅 *ACTUALIZADO:* ${new Date().toLocaleDateString()}
┃
${Object.entries(categorias).map(([categoria, configs]) => `
┃ 📂 *${categoria.toUpperCase()}*
${configs.map(config => {
  const valorDisplay = config.tipo === 'toggle' 
    ? (config.valorActual ? '✅' : '❌')
    : `📝 (${config.valorActual.toString().substring(0, 20)}${config.valorActual.toString().length > 20 ? '...' : ''})`
  return `┃   • ${config.nombre}: ${valorDisplay}`
}).join('\n')}`).join('\n')}
┃
┃ 🔧 *COMANDOS RÁPIDOS:*
┃ → ${usedPrefix}${command} <config> <valor>
┃ → ${usedPrefix}${command} view - Ver todo
┃ → ${usedPrefix}${command} reset - Restaurar
┃ → ${usedPrefix}${command} help - Ayuda
┃
┃ 💡 *EJEMPLOS:*
┃ • ${usedPrefix}${command} welcome on
┃ • ${usedPrefix}${command} antilink off
┃ • ${usedPrefix}${command} s.welcome "Nuevo mensaje"
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
  `.trim()

  await conn.reply(m.chat, panel, m)
  await m.react('✅')
}

// 📋 FUNCIÓN: Mostrar configuración completa
async function mostrarConfiguracionCompleta(m, conn, chat, usuario, chatData, configuraciones) {
  let configCompleta = `
╭━━━━━━〔📋 CONFIGURACIÓN COMPLETA 〕━━━━━━╮
┃
┃ 👥 *GRUPO:* ${chat.nombre}
┃ 👤 *USUARIO:* ${usuario.tag}
┃ 🕐 *FECHA:* ${new Date().toLocaleString()}
┃
`

  // Agrupar por categoría
  const configsPorCategoria = {}
  Object.entries(configuraciones).forEach(([key, config]) => {
    if (!configsPorCategoria[config.categoria]) {
      configsPorCategoria[config.categoria] = []
    }
    configsPorCategoria[config.categoria].push({ key, ...config })
  })

  Object.entries(configsPorCategoria).forEach(([categoria, configs]) => {
    configCompleta += `\n┃ 📂 *${categoria.toUpperCase()}*\n`
    
    configs.forEach((config, index) => {
      let valorDisplay
      
      if (config.tipo === 'toggle') {
        valorDisplay = config.valorActual ? '✅ ACTIVADO' : '❌ DESACTIVADO'
      } else if (config.tipo === 'text') {
        const valor = config.valorActual.toString()
        valorDisplay = `"${valor.substring(0, 50)}${valor.length > 50 ? '...' : ''}"`
      } else {
        valorDisplay = config.valorActual.toString()
      }
      
      configCompleta += `┃ ${index + 1}. *${config.nombre}*\n`
      configCompleta += `┃    🔧 Clave: ${config.key}\n`
      configCompleta += `┃    📊 Estado: ${valorDisplay}\n`
      configCompleta += `┃    📝 ${config.descripcion}\n`
      configCompleta += `┃    🔐 Requiere: ${config.requiere === 'owner' ? 'Dueño del bot' : 'Administrador'}\n`
    })
  })

  configCompleta += `
┃
┃ 📈 *RESUMEN:*
┃ • Total configuraciones: ${Object.keys(configuraciones).length}
┃ • Activadas: ${Object.values(configuraciones).filter(c => c.tipo === 'toggle' && c.valorActual).length}
┃ • Desactivadas: ${Object.values(configuraciones).filter(c => c.tipo === 'toggle' && !c.valorActual).length}
┃ • Personalizadas: ${Object.values(configuraciones).filter(c => c.tipo === 'text' && c.valorActual !== 'No configurado').length}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
  `.trim()

  await conn.reply(m.chat, configCompleta, m)
  await m.react('✅')
}

// ❓ FUNCIÓN: Mostrar ayuda
async function mostrarAyuda(m, conn, usedPrefix, command, comandoInfo) {
  const ayuda = `
╭━━━━━━〔📘 AYUDA DE CONFIGGRUPO 〕━━━━━━╮
┃
┃ 📌 *DESCRIPCIÓN:* ${comandoInfo.descripcion}
┃ 👤 *AUTOR:* ${comandoInfo.autor}
┃ 🔧 *VERSIÓN:* ${comandoInfo.version}
┃
┃ 🎯 *USO PRINCIPAL:*
┃ ${usedPrefix}${command} [configuración] [valor]
┃
┃ 📋 *CONFIGURACIONES DISPONIBLES:*
┃
┃ 🎉 *BIENVENIDAS:*
┃ • welcome - Activa/desactiva sistema
┃ • s.welcome - Mensaje de bienvenida
┃ • s.bye - Mensaje de despedida
┃
┃ 🛡️ *SEGURIDAD:*
┃ • antilink - Bloquea enlaces
┃ • nsfw - Contenido +18
┃ • detect - Detección automática
┃
┃ 🤖 *BOT:*
┃ • economy - Sistema económico
┃ • gacha - Sistema de gacha
┃ • primarybot - Bot principal
┃
┃ 🔧 *AVANZADO:*
┃ • modoadmin - Solo admins
┃ • antiprivate - Anti-privado
┃ • gponly - Solo grupos
┃
┃ ⚙️ *COMANDOS ADICIONALES:*
┃ • ${usedPrefix}${command} panel - Ver panel
┃ • ${usedPrefix}${command} view - Ver todo
┃ • ${usedPrefix}${command} reset - Restaurar
┃ • ${usedPrefix}${command} backup - Respaldar
┃ • ${usedPrefix}${command} help - Esta ayuda
┃
┃ 💡 *EJEMPLOS PRÁCTICOS:*
┃ • ${usedPrefix}${command} welcome on
┃ • ${usedPrefix}${command} antilink off
┃ • ${usedPrefix}${command} s.welcome "¡Hola @user!"
┃ • ${usedPrefix}${command} economy on
┃ • ${usedPrefix}${command} modoadmin on
┃
┃ ⚠️ *NOTAS IMPORTANTES:*
┃ 1. Algunas configs requieren permisos de admin
┃ 2. Los cambios se guardan automáticamente
┃ 3. Usa reset con cuidado
┃ 4. Para mensajes personalizados: ${usedPrefix}setwelcome
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
  `.trim()

  await conn.reply(m.chat, ayuda, m)
  await m.react('✅')
}

// ⚙️ FUNCIÓN: Manejar configuración específica
async function manejarConfiguracion(m, conn, chat, usuario, chatData, configKey, config, valor, usedPrefix, command) {
  // Verificar permisos
  if (config.requiere === 'admin' && !usuario.esAdmin && !usuario.esOwner) {
    return conn.reply(m.chat, '❌ Esta configuración requiere permisos de administrador.', m)
  }
  
  if (config.requiere === 'owner' && !usuario.esOwner) {
    return conn.reply(m.chat, '❌ Esta configuración solo puede ser modificada por el dueño del bot.', m)
  }

  // Si no hay valor, mostrar estado actual
  if (!valor) {
    let estadoActual
    let ejemplos = ''
    
    if (config.tipo === 'toggle') {
      estadoActual = config.valorActual ? '✅ ACTIVADO' : '❌ DESACTIVADO'
      ejemplos = `\n💡 Ejemplos:\n• ${usedPrefix}${command} ${configKey} on\n• ${usedPrefix}${command} ${configKey} off`
    } else if (config.tipo === 'text') {
      estadoActual = `"${config.valorActual}"`
      ejemplos = `\n💡 Ejemplo:\n${usedPrefix}${command} ${configKey} "nuevo valor"`
    } else {
      estadoActual = config.valorActual.toString()
    }
    
    const infoConfig = `
╭━━〔⚙️ CONFIGURACIÓN: ${config.nombre.toUpperCase()} 〕━━╮
┃
┃ 📊 *Estado actual:* ${estadoActual}
┃ 📝 *Descripción:* ${config.descripcion}
┃ 🔐 *Permisos:* ${config.requiere === 'owner' ? 'Dueño del bot' : 'Administrador'}
┃
┃ 🛠️ *Uso:*
┃ ${usedPrefix}${command} ${configKey} <valor>
${ejemplos}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
    `.trim()
    
    await conn.reply(m.chat, infoConfig, m)
    return
  }

  // Procesar el valor según el tipo
  let nuevoValor
  let mensajeConfirmacion
  
  try {
    if (config.tipo === 'toggle') {
      const valorLower = valor.toLowerCase()
      if (['on', 'true', 'yes', 'si', 'activar', 'enable', '1'].includes(valorLower)) {
        nuevoValor = true
        mensajeConfirmacion = '✅ Activado'
      } else if (['off', 'false', 'no', 'desactivar', 'disable', '0'].includes(valorLower)) {
        nuevoValor = false
        mensajeConfirmacion = '✅ Desactivado'
      } else {
        return conn.reply(m.chat, 
          `❌ Valor no válido para configuración toggle.\n\n` +
          `Usa: on/off, true/false, si/no, activar/desactivar`, m)
      }
      
      // Guardar en la base de datos
      const dbKey = configKey.includes('.') ? configKey.split('.')[1] : configKey
      chatData[dbKey] = nuevoValor
      
    } else if (config.tipo === 'text') {
      if (valor.length > 1000) {
        return conn.reply(m.chat, '❌ El texto no puede exceder los 1000 caracteres.', m)
      }
      
      nuevoValor = valor
      mensajeConfirmacion = `✅ Actualizado: "${valor.substring(0, 50)}${valor.length > 50 ? '...' : ''}"`
      
      // Guardar en la base de datos
      const dbKey = configKey.includes('.') ? configKey.split('.')[1] : configKey
      chatData[dbKey] = nuevoValor
      
    } else {
      return conn.reply(m.chat, `❌ Tipo de configuración no soportado: ${config.tipo}`, m)
    }
    
    // Configuraciones especiales que requieren acciones adicionales
    if (configKey === 'primarybot') {
      // Esta configuración podría requerir lógica adicional
      mensajeConfirmacion += '\n⚠️ Nota: Esta configuración puede requerir reinicio del bot.'
    }
    
    // Enviar confirmación
    await conn.reply(m.chat, 
      `⚙️ *${config.nombre}*\n\n` +
      `${mensajeConfirmacion}\n\n` +
      `👤 Configurado por: ${usuario.tag}\n` +
      `👥 Grupo: ${chat.nombre}\n` +
      `🕐 ${new Date().toLocaleTimeString()}`, m)
    
    await m.react('✅')
    
  } catch (error) {
    await m.react('❌')
    await conn.reply(m.chat, 
      `❌ Error al actualizar configuración:\n${error.message}`, m)
  }
}

// 🔧 CONFIGURACIÓN DEL COMANDO
handler.help = ['configgrupo']
handler.tags = ['group', 'config', 'admin']
handler.command = ['configgrupo', 'panelconfig', 'configpanel', 'gruposettings', 'groupconfig']

// 🎯 RESTRICCIONES
handler.group = true
// handler.admin = true  // Descomentar si quieres que solo admins puedan usarlo

export default handler
