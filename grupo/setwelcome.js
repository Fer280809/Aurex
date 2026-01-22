/**
 * 🎉 SISTEMA DE BIENVENIDAS/DESPEDIDAS
 * Configura mensajes personalizados para nuevos miembros
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
      nombre: 'setwelcome',
      version: '2.0',
      autor: 'Fernando',
      descripcion: 'Configurar mensajes de bienvenida y despedida del grupo',
      uso: `${usedPrefix}${command} [welcome/bye/on/off/view/reset]`
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

    // Obtener datos del chat desde la base de datos
    const chatData = global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {}
    
    // Verificar permisos
    if (!usuario.esAdmin && !usuario.esOwner) {
      return conn.reply(m.chat, '❌ Solo administradores pueden configurar las bienvenidas.', m)
    }

    // 🔹 PROCESAR ARGUMENTOS
    const parametros = text.trim()
    const [subcomando, ...resto] = args
    const contenido = resto.join(' ')
    
    // Reacción de espera
    await m.react('⏳')

    // 🛠️ CÓDIGO PRINCIPAL
    if (!subcomando) {
      // Mostrar panel de configuración
      const estado = chatData.welcome ? '🟢 ACTIVADO' : '🔴 DESACTIVADO'
      const bienvenida = chatData.sWelcome || '🎉 ¡Bienvenido/a al grupo!'
      const despedida = chatData.sBye || '👋 ¡Hasta luego!'
      
      const panel = `
╭━━〔🎉 CONFIGURACIÓN DE BIENVENIDAS 〕━━╮
┃
┃ 📊 *Estado:* ${estado}
┃ 👥 *Grupo:* ${chat.nombre}
┃ 👤 *Configurando:* ${usuario.tag}
┃
┃ 📝 *Mensaje de Bienvenida:*
┃ ${bienvenida.substring(0, 100)}${bienvenida.length > 100 ? '...' : ''}
┃
┃ 📝 *Mensaje de Despedida:*
┃ ${despedida.substring(0, 100)}${despedida.length > 100 ? '...' : ''}
┃
┃ 🔧 *Comandos disponibles:*
┃ → ${usedPrefix}${command} welcome <mensaje>
┃ → ${usedPrefix}${command} bye <mensaje>
┃ → ${usedPrefix}${command} on/off
┃ → ${usedPrefix}${command} view
┃ → ${usedPrefix}${command} reset
┃ → ${usedPrefix}${command} test
┃ → ${usedPrefix}${command} syntax
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
      `.trim()
      
      await conn.reply(m.chat, panel, m)
      await m.react('✅')
      return
    }

    // Manejar subcomandos
    switch (subcomando.toLowerCase()) {
      case 'welcome':
      case 'bienvenida':
        if (!contenido) {
          const actual = chatData.sWelcome || '🎉 ¡Bienvenido/a al grupo!'
          return conn.reply(m.chat, 
            `📝 *Mensaje actual de bienvenida:*\n\n${actual}\n\n` +
            `Para cambiar:\n${usedPrefix}${command} welcome <mensaje>\n\n` +
            `Ejemplo:\n${usedPrefix}${command} welcome ¡Hola @user! Bienvenido a @subject`, m)
        }
        
        if (contenido.length > 1000) {
          return conn.reply(m.chat, '❌ El mensaje no puede exceder 1000 caracteres.', m)
        }
        
        chatData.sWelcome = contenido
        await conn.reply(m.chat, `✅ *Bienvenida configurada correctamente*\n\n📝 Nuevo mensaje:\n${contenido}`, m)
        break
        
      case 'bye':
      case 'despedida':
      case 'adios':
        if (!contenido) {
          const actual = chatData.sBye || '👋 ¡Hasta luego!'
          return conn.reply(m.chat, 
            `📝 *Mensaje actual de despedida:*\n\n${actual}\n\n` +
            `Para cambiar:\n${usedPrefix}${command} bye <mensaje>`, m)
        }
        
        if (contenido.length > 1000) {
          return conn.reply(m.chat, '❌ El mensaje no puede exceder 1000 caracteres.', m)
        }
        
        chatData.sBye = contenido
        await conn.reply(m.chat, `✅ *Despedida configurada correctamente*\n\n📝 Nuevo mensaje:\n${contenido}`, m)
        break
        
      case 'on':
      case 'activar':
        chatData.welcome = true
        await conn.reply(m.chat, '✅ *Sistema de bienvenidas ACTIVADO*', m)
        break
        
      case 'off':
      case 'desactivar':
        chatData.welcome = false
        await conn.reply(m.chat, '✅ *Sistema de bienvenidas DESACTIVADO*', m)
        break
        
      case 'view':
      case 'ver':
        const status = chatData.welcome ? '🟢 ACTIVADO' : '🔴 DESACTIVADO'
        const welcomeMsg = chatData.sWelcome || '🎉 ¡Bienvenido/a al grupo!'
        const byeMsg = chatData.sBye || '👋 ¡Hasta luego!'
        
        const vista = `
╭━━〔👁️ VISTA DE CONFIGURACIÓN 〕━━╮
┃
┃ 📊 *Estado:* ${status}
┃ 👥 *Grupo:* ${chat.nombre}
┃
┃ 🎉 *Mensaje de Bienvenida:*
┃ ${welcomeMsg}
┃
┃ 👋 *Mensaje de Despedida:*
┃ ${byeMsg}
┃
┃ 📈 *Estadísticas:*
┃ • Bienvenida: ${welcomeMsg.length} caracteres
┃ • Despedida: ${byeMsg.length} caracteres
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
        `.trim()
        
        await conn.reply(m.chat, vista, m)
        break
        
      case 'reset':
      case 'reiniciar':
        delete chatData.sWelcome
        delete chatData.sBye
        chatData.welcome = true
        await conn.reply(m.chat, '✅ *Configuración restaurada a valores por defecto*', m)
        break
        
      case 'test':
      case 'probar':
        const testUser = {
          id: m.sender,
          name: usuario.nombre
        }
        
        const testWelcome = chatData.sWelcome || '🎉 ¡Bienvenido/a al grupo!'
        const formatted = formatMessage(testWelcome, testUser, { subject: chat.nombre }, 'welcome')
        
        await conn.reply(m.chat, `🧪 *PRUEBA DE BIENVENIDA*\n\n${formatted}`, m)
        break
        
      case 'syntax':
      case 'sintaxis':
        const guia = `
╭━━〔📘 GUÍA DE SINTAXIS 〕━━╮
┃
┃ 🔤 *VARIABLES DISPONIBLES:*
┃ • @user → Nombre del usuario
┃ • @number → Número del usuario
┃ • @mention → Mención (@número)
┃ • @subject → Nombre del grupo
┃ • @desc → Descripción del grupo
┃ • @membercount → Total de miembros
┃ • @time → Hora actual
┃ • @date → Fecha actual
┃ • @botname → Nombre del bot
┃
┃ 📝 *EJEMPLOS:*
┃ → ¡Hola @user! Bienvenido a @subject 👋
┃ → @mention se unió al grupo @groupname 🎉
┃ → @user ha salido de @subject 👋
┃ → Bienvenido @user! Somos @membercount miembros 🤝
┃
┃ ⚠️ *NOTAS:*
┃ • Límite: 1000 caracteres por mensaje
┃ • Usa \\n para saltos de línea
┃ • Las variables distinguen mayúsculas/minúsculas
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯
        `.trim()
        
        await conn.reply(m.chat, guia, m)
        break
        
      default:
        return conn.reply(m.chat, 
          `❌ Subcomando no reconocido.\n\n` +
          `📋 *Uso correcto:*\n` +
          `${usedPrefix}${command} [welcome/bye/on/off/view/reset/test/syntax]`, m)
    }
    
    await m.react('✅')

  } catch (error) {
    console.error(`❌ Error en ${command}:`, error)
    await m.react('❌')
    
    const errorMsg = `
╭━━〔⚠️ ERROR EN SETWELCOME 〕━━╮
┃
┃ 🐛 *Comando:* ${command}
┃ 👤 *Usuario:* @${m.sender.split('@')[0]}
┃
┃ 📛 *Error:*
┃ ${error.message}
┃
┃ 🔧 *Solución:*
┃ 1. Verifica los parámetros
┃ 2. Revisa la sintaxis
┃ 3. Reporta el error con:
┃    ${usedPrefix}report
┃
╰━━━━━━━━━━━━━━━━━━━━━╯
    `.trim()
    
    await conn.reply(m.chat, errorMsg, m)
  }
}

// Función para formatear mensajes
function formatMessage(message, user, group, type = 'welcome') {
  const now = new Date()
  const replacements = {
    '@user': user.name || 'Usuario',
    '@number': user.id.split('@')[0] || '',
    '@mention': `@${user.id.split('@')[0]}`,
    '@subject': group.subject || 'Grupo',
    '@desc': group.desc || 'Sin descripción',
    '@membercount': group.participants?.length || 0,
    '@time': now.toLocaleTimeString('es-ES'),
    '@date': now.toLocaleDateString('es-ES'),
    '@botname': global.botname || 'Asta Bot'
  }
  
  let formatted = message
  for (const [key, value] of Object.entries(replacements)) {
    formatted = formatted.replace(new RegExp(key, 'gi'), value)
  }
  
  return formatted
}

// 🔧 CONFIGURACIÓN DEL COMANDO
handler.help = ['setwelcome']
handler.tags = ['group']
handler.command = ['setwelcome', 'configwelcome', 'bienvenida']

// 🎯 RESTRICCIONES
handler.group = true
handler.admin = true

export default handler
