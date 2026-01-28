/*import moment from 'moment-timezone'

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
if (!text) return conn.reply(m.chat, `❀ Por favor, ingrese el número al que quiere enviar una invitación al grupo.`, m)
if (text.includes('+')) return conn.reply(m.chat, `ꕥ Ingrese el número todo junto sin el *+*`, m)
if (isNaN(text)) return conn.reply(m.chat, `ꕥ Ingrese sólo números sin su código de país y sin espacios.`, m)
let group = m.chat
let link = 'https://chat.whatsapp.com/' + await conn.groupInviteCode(group)
let tag = m.sender ? '@' + m.sender.split('@')[0] : 'Usuario'
const chatLabel = m.isGroup ? (await conn.getName(m.chat) || 'Grupal') : 'Privado'
const horario = `${moment.tz('America/Caracas').format('DD/MM/YYYY hh:mm:ss A')}`
const invite = `❀ 𝗜𝗡𝗩𝗜𝗧𝗔𝗖𝗜𝗢𝗡 𝗔 𝗨𝗡 𝗚𝗥𝗨𝗣𝗢\n\nꕥ *Usuario* » ${tag}\n✿ *Chat* » ${chatLabel}\n✰ *Fecha* » ${horario}\n✦ *Link* » ${link}`
await conn.reply(`${text}@s.whatsapp.net`, invite, m, { mentions: [m.sender] })
m.reply(`❀ El enlace de invitación fue enviado al usuario correctamente.`)
}

handler.help = ['invite']
handler.tags = ['group']
handler.command = ['add', 'agregar', 'añadir']
handler.group = true
handler.botAdmin = true

export default handler*/




import moment from 'moment-timezone'

let handler = async (m, { conn, args, text, usedPrefix, command, editMessage }) => {
  // Verificar si hay texto
  if (!text) {
    const buttons = [
      { buttonId: '.add help', buttonText: { displayText: '❓ Ayuda' } },
      { buttonId: '.cancel', buttonText: { displayText: '❌ Cancelar' } }
    ]
    
    const message = `❀ *INVITACIÓN A GRUPO*\n\nPor favor, ingresa el número al que quieres enviar una invitación.\n\n*Ejemplo:*\n\`\`\`${usedPrefix}add 1234567890\`\`\``
    
    // Si tenemos función de edición, usarla
    if (editMessage) {
      await editMessage({
        text: message,
        buttons: buttons,
        footer: 'Selecciona una opción'
      })
    } else {
      await conn.sendMessage(m.chat, {
        text: message,
        buttons: buttons,
        footer: 'Selecciona una opción'
      }, { quoted: m })
    }
    return
  }
  
  // Validar número
  if (text.includes('+')) {
    const buttons = [
      { buttonId: '.add ' + text.replace('+', ''), buttonText: { displayText: '🔢 Quitar +' } },
      { buttonId: '.cancel', buttonText: { displayText: '❌ Cancelar' } }
    ]
    
    const message = `❀ *NÚMERO INCORRECTO*\n\nIngresa el número sin el símbolo *+*\n\n*Tu entrada:* \`${text}\`\n*Corregido:* \`${text.replace('+', '')}\``
    
    if (editMessage) {
      await editMessage({
        text: message,
        buttons: buttons
      })
    } else {
      await conn.reply(m.chat, message, m)
    }
    return
  }
  
  if (isNaN(text)) {
    const message = `❀ *ERROR DE FORMATO*\n\nIngresa sólo números sin código de país y sin espacios.\n\n*Ejemplo correcto:* \`${usedPrefix}add 1234567890\`\n*Tu entrada:* \`${text}\``
    
    const buttons = [
      { buttonId: '.add help', buttonText: { displayText: '📚 Ver ejemplo' } },
      { buttonId: '.cancel', buttonText: { displayText: '❌ Cancelar' } }
    ]
    
    if (editMessage) {
      await editMessage({
        text: message,
        buttons: buttons
      })
    } else {
      await conn.reply(m.chat, message, m)
    }
    return
  }
  
  // Verificar que el bot sea admin del grupo
  if (!m.isGroup) {
    const message = '❀ *ERROR*\n\nEste comando solo funciona en grupos.'
    
    if (editMessage) {
      await editMessage(message)
    } else {
      await conn.reply(m.chat, message, m)
    }
    return
  }
  
  try {
    // Obtener información del grupo
    let group = m.chat
    let groupName = await conn.getName(group) || 'Grupo sin nombre'
    let participantsCount = (await conn.groupMetadata(group)).participants.length
    
    // Generar link de invitación
    let link = 'https://chat.whatsapp.com/' + await conn.groupInviteCode(group)
    
    // Preparar datos para el mensaje
    let tag = m.sender ? '@' + m.sender.split('@')[0] : 'Usuario'
    const horario = `${moment.tz('America/Caracas').format('DD/MM/YYYY hh:mm:ss A')}`
    
    // Mensaje de confirmación con botones
    const confirmMessage = `❀ *CONFIRMAR INVITACIÓN*\n\n¿Estás seguro de enviar una invitación a:\n📱 *Número:* \`${text}\`\n\n📊 *Datos del grupo:*
├ *Nombre:* ${groupName}
├ *Miembros:* ${participantsCount}
└ *Tu usuario:* ${tag}\n\n*Fecha:* ${horario}`
    
    const confirmButtons = [
      { buttonId: '.add_confirm ' + text, buttonText: { displayText: '✅ Confirmar' } },
      { buttonId: '.cancel', buttonText: { displayText: '❌ Cancelar' } }
    ]
    
    if (editMessage) {
      await editMessage({
        text: confirmMessage,
        buttons: confirmButtons,
        footer: 'Confirma antes de enviar la invitación'
      })
    } else {
      await conn.sendMessage(m.chat, {
        text: confirmMessage,
        buttons: confirmButtons,
        footer: 'Confirma antes de enviar la invitación'
      }, { quoted: m })
    }
    
  } catch (error) {
    console.error('Error en add.js:', error)
    
    const errorMessage = `❀ *ERROR*\n\nNo se pudo generar la invitación.\n\n*Posibles causas:*
1. El bot no es administrador
2. El grupo está restringido
3. Error de conexión
    
*Error:* ${error.message || error}`
    
    const errorButtons = [
      { buttonId: '.add ' + text, buttonText: { displayText: '🔄 Reintentar' } },
      { buttonId: '.help', buttonText: { displayText: '❓ Ayuda' } }
    ]
    
    if (editMessage) {
      await editMessage({
        text: errorMessage,
        buttons: errorButtons
      })
    } else {
      await conn.reply(m.chat, errorMessage, m)
    }
  }
}

// Handler para confirmación de invitación
async function confirmAdd(m, { conn, args, editMessage }) {
  const number = args[0]
  
  if (!number) {
    if (editMessage) {
      await editMessage('❀ *ERROR*\n\nNo se especificó el número.\nUsa: `.add <número>`')
    } else {
      await conn.reply(m.chat, '❀ *ERROR*\n\nNo se especificó el número.\nUsa: `.add <número>`', m)
    }
    return
  }
  
  try {
    // Generar link de invitación
    let group = m.chat
    let link = 'https://chat.whatsapp.com/' + await conn.groupInviteCode(group)
    let tag = m.sender ? '@' + m.sender.split('@')[0] : 'Usuario'
    const chatLabel = m.isGroup ? (await conn.getName(m.chat) || 'Grupal') : 'Privado'
    const horario = `${moment.tz('America/Caracas').format('DD/MM/YYYY hh:mm:ss A')}`
    
    // Mensaje de invitación
    const invite = `❀ 𝗜𝗡𝗩𝗜𝗧𝗔𝗖𝗜𝗢𝗡 𝗔 𝗨𝗡 𝗚𝗥𝗨𝗣𝗢\n\nꕥ *Usuario* » ${tag}\n✿ *Chat* » ${chatLabel}\n✰ *Fecha* » ${horario}\n✦ *Link* » ${link}`
    
    // Enviar al número destino
    await conn.reply(`${number}@s.whatsapp.net`, invite, m, { mentions: [m.sender] })
    
    // Mensaje de éxito con botones
    const successMessage = `❀ *INVITACIÓN ENVIADA*\n\n✅ La invitación fue enviada correctamente a:\n📱 *Número:* \`${number}\`\n\n*Detalles:*
├ *Destinatario:* ${number}
├ *Enlace:* ${link}
├ *Enviado por:* ${tag}
└ *Fecha:* ${horario}`
    
    const successButtons = [
      { buttonId: '.add ' + number, buttonText: { displayText: '📤 Reenviar' } },
      { buttonId: '.add another', buttonText: { displayText: '➕ Otro número' } },
      { buttonId: '.menu', buttonText: { displayText: '📋 Menú' } }
    ]
    
    if (editMessage) {
      await editMessage({
        text: successMessage,
        buttons: successButtons,
        footer: 'Invitación enviada exitosamente'
      })
    } else {
      await m.reply(successMessage)
    }
    
  } catch (error) {
    console.error('Error enviando invitación:', error)
    
    const errorMessage = `❀ *ERROR AL ENVIAR*\n\nNo se pudo enviar la invitación a \`${number}\`\n\n*Posibles causas:*
1. El número no existe en WhatsApp
2. El número tiene restricciones
3. Error de conexión
    
*Error:* ${error.message || error}`
    
    const errorButtons = [
      { buttonId: '.add ' + number, buttonText: { displayText: '🔄 Reintentar' } },
      { buttonId: '.add help', buttonText: { displayText: '❓ Ayuda' } }
    ]
    
    if (editMessage) {
      await editMessage({
        text: errorMessage,
        buttons: errorButtons
      })
    } else {
      await conn.reply(m.chat, errorMessage, m)
    }
  }
}

// Handler para añadir otro número
async function addAnother(m, { conn, editMessage }) {
  const message = `❀ *NUEVA INVITACIÓN*\n\nPor favor, ingresa el número al que quieres enviar una invitación.\n\n*Ejemplo:*\n\`\`\`.add 1234567890\`\`\``
  
  const buttons = [
    { buttonId: '.add help', buttonText: { displayText: '📚 Ejemplos' } },
    { buttonId: '.cancel', buttonText: { displayText: '❌ Cancelar' } }
  ]
  
  if (editMessage) {
    await editMessage({
      text: message,
      buttons: buttons,
      footer: 'Escribe un número o selecciona una opción'
    })
  } else {
    await conn.sendMessage(m.chat, {
      text: message,
      buttons: buttons,
      footer: 'Escribe un número o selecciona una opción'
    }, { quoted: m })
  }
}

// Handler de ayuda
async function addHelp(m, { conn, editMessage }) {
  const helpMessage = `❀ *AYUDA - COMANDO ADD*\n\n*Uso:* \`.add <número>\`
  
*Ejemplos válidos:*
├ \`.add 1234567890\`
├ \`.add 04121234567\`
└ \`.add 584121234567\`

*Ejemplos inválidos:*
├ \`.add +1234567890\` ❌ (con +)
├ \`.add 123 456 7890\` ❌ (con espacios)
└ \`.add abcdef\` ❌ (no numérico)

*Requisitos:*
✅ Bot debe ser administrador
✅ Comando en grupo
✅ Número sin código de país`

  if (editMessage) {
    await editMessage(helpMessage)
  } else {
    await conn.reply(m.chat, helpMessage, m)
  }
}

// Configuración principal del handler
handler.help = ['invite']
handler.tags = ['group']
handler.command = ['add', 'agregar', 'añadir']
handler.group = true
handler.botAdmin = true
handler.editMessage = true // ← ACTIVA LA EDICIÓN DE MENSAJES

export default handler

// Exportar handlers adicionales para botones
export {
  confirmAdd,
  addAnother,
  addHelp
}

// También podemos registrar estos handlers como plugins adicionales
if (!global.plugins['add-confirm']) {
  global.plugins['add-confirm'] = {
    name: 'add-confirm',
    command: ['add_confirm'],
    group: true,
    botAdmin: true,
    editMessage: true,
    async handler(m, { conn, args, editMessage }) {
      await confirmAdd.call(this, m, { conn, args, editMessage })
    }
  }
}

if (!global.plugins['add-another']) {
  global.plugins['add-another'] = {
    name: 'add-another',
    command: ['add another'],
    group: true,
    botAdmin: true,
    editMessage: true,
    async handler(m, { conn, editMessage }) {
      await addAnother.call(this, m, { conn, editMessage })
    }
  }
}

if (!global.plugins['add-help']) {
  global.plugins['add-help'] = {
    name: 'add-help',
    command: ['add help'],
    async handler(m, { conn, editMessage }) {
      await addHelp.call(this, m, { conn, editMessage })
    }
  }
}