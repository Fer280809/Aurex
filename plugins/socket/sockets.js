import { jidDecode } from '@whiskeysockets/baileys'
import path from 'path'
import fs from 'fs'
import ws from 'ws'

const linkRegex = /https:\/\/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i

const handler = async (m, { conn, command, usedPrefix, text, isFernando, isfernando }) => {
try {
const authorizedNumbers = ['5214183357841@s.whatsapp.net']

const isSubBots = [conn.user.jid, ...global.owner.map(([number]) => `${number}@s.whatsapp.net`)].includes(m.sender)
const isAuthorized = authorizedNumbers.includes(m.sender)
const canUse = isSubBots || isFernando || isfernando || isAuthorized

if (!canUse) return m.reply(`❀ El comando *${command}* solo puede ser ejecutado por el Socket o Fernando.`)

switch (command) {
case 'self': case 'public': case 'antiprivado': case 'antiprivate': case 'gponly': case 'sologp': {
const config = global.db.data.settings[conn.user.jid]
const value = text ? text.trim().toLowerCase() : ''
const type = /self|public/.test(command) ? 'self' : /antiprivado|antiprivate/.test(command) ? 'antiPrivate' : /gponly|sologp/.test(command) ? 'gponly' : null

if (!type) return m.reply(`ꕥ Modo no reconocido.`)

const isEnable = config[type] || false
const enable = value === 'enable' || value === 'on'
const disable = value === 'disable' || value === 'off'

if (enable || disable) {
if (isEnable === enable)
return m.reply(`ꕥ El modo *${type}* ya estaba ${enable ? 'activado' : 'desactivado'}.`)
config[type] = enable
return conn.reply(m.chat, `❀ Has *${enable ? 'activado' : 'desactivado'}* el modo *${type}* para el Socket.`, m)
}

conn.reply(m.chat, `「✦」Puedes activar o desactivar el modo *${type}* utilizando:\n\n● Activar » ${usedPrefix}${command} enable\n● Desactivar » ${usedPrefix}${command} disable\n\n✧ Estado actual » *${isEnable ? '✓ Activado' : '✗ Desactivado'}*`, m)
break
}

case 'join': {
if (!text) return m.reply(`❀ Debes enviar un enlace de invitación para unirme a un grupo.`)
const [_, code] = text.match(linkRegex) || []
if (!code) return m.reply(`ꕥ El enlace de invitación no es válido.`)

await m.react('🕒')
await conn.groupAcceptInvite(code)
await m.react('✔️')
m.reply(`❀ ${botname} se ha unido exitosamente al grupo.`)
break
}

case 'salir': case 'leave': {
await m.react('🕒')
const id = text || m.chat
const chat = global.db.data.chats[m.chat]
chat.welcome = false
await conn.reply(id, `❀ Adiós a todos, ${botname} se despide! (≧ω≦)ゞ`)
await conn.groupLeave(id)
chat.welcome = true
await m.react('✔️')
break
}

case 'logout': {
const rawId = conn.user?.id || ''
const cleanId = jidDecode(rawId)?.user || rawId.split('@')[0]
const index = global.conns?.findIndex(c => c.user.jid === m.sender)

if (global.conn.user.jid === conn.user.jid)
return conn.reply(m.chat, '❀ Este comando está deshabilitado en las sesiones principales.', m)

if (index === -1 || !global.conns[index])
return conn.reply(m.chat, '⚠︎ La sesión ya está cerrada o no se encontró una conexión activa.', m)

conn.reply(m.chat, '✩ Tu sesión ha sido cerrada exitosamente.', m)

setTimeout(async () => {
await global.conns[index].logout()
global.conns.splice(index, 1)
const sessionPath = path.join(global.jadi, cleanId)
if (fs.existsSync(sessionPath)) {
fs.rmSync(sessionPath, { recursive: true, force: true })
console.log(`⚠︎ Sesión de ${cleanId} eliminada de ${sessionPath}`)
}
}, 3000)
break
}

case 'reload': {
const rawId = conn.user?.id || ''
const cleanId = jidDecode(rawId)?.user || rawId.split('@')[0]
const sessionPath = path.join(global.jadi, cleanId)

if (!fs.existsSync(sessionPath)) 
return conn.reply(m.chat, '❀ Este comando solo puede ejecutarse desde una instancia Sub-Bot.', m)

await m.react('🕒')

if (typeof global.reloadHandler !== 'function')
throw new Error('No se encontró la función global.reloadHandler')

await global.reloadHandler(true)
await m.react('✔️')
conn.reply(m.chat, '✿ La sesión fue recargada correctamente.', m)
break
}

case 'subconfig': {
const [action, ...values] = text.split(' ')
const value = values.join(' ')

if (!action) {
const sessionId = conn.user.jid.split('@')[0]
const configPath = path.join(global.jadi, sessionId, 'config.json')
let config = {}
if (fs.existsSync(configPath)) {
config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
}

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
message += `└ ${usedPrefix}subconfig reset - Restablecer`

await conn.sendMessage(m.chat, { 
text: message,
mentions: config.owner ? [config.owner] : []
}, { quoted: m })
return
}

const sessionId = conn.user.jid.split('@')[0]
const configPath = path.join(global.jadi, sessionId, 'config.json')
let config = {}
if (fs.existsSync(configPath)) {
config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
}

switch (action.toLowerCase()) {
case 'prefix': {
if (!value) return m.reply(`⚠️ Uso: ${usedPrefix}subconfig prefix <nuevo prefijo>`)
if (value.length > 5) return m.reply('❌ El prefijo no puede tener más de 5 caracteres.')

const oldPrefix = config.prefix || global.prefix
config.prefix = value

conn.subConfig = conn.subConfig || {}
conn.subConfig.prefix = value

config.updatedAt = new Date().toISOString()
fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

if (global.subBotsData) {
global.subBotsData.set(configPath, config)
}

return m.reply(`✅ Prefijo cambiado:\nDe: \`${oldPrefix}\`\nA: \`${value}\``)
}

case 'name': {
if (!value) return m.reply(`⚠️ Uso: ${usedPrefix}subconfig name <nuevo nombre>`)
if (value.length > 30) return m.reply('❌ El nombre no puede tener más de 30 caracteres.')

const oldName = config.name || conn.user.name
config.name = value

conn.subConfig = conn.subConfig || {}
conn.subConfig.name = value

config.updatedAt = new Date().toISOString()
fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

if (global.subBotsData) {
global.subBotsData.set(configPath, config)
}

return m.reply(`✅ Nombre cambiado:\nDe: *${oldName}*\nA: *${value}*`)
}

case 'mode': {
if (!value) return m.reply(`⚠️ Uso: ${usedPrefix}subconfig mode <public/private>`)

const mode = value.toLowerCase()
if (!['public', 'private'].includes(mode)) {
return m.reply('❌ Modos válidos: public, private')
}

config.mode = mode

if (!global.db.data.settings[conn.user.jid]) {
global.db.data.settings[conn.user.jid] = {}
}
global.db.data.settings[conn.user.jid].self = mode === 'private'

config.updatedAt = new Date().toISOString()
fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

if (global.subBotsData) {
global.subBotsData.set(configPath, config)
}

return m.reply(`✅ Modo cambiado a: *${mode}*`)
}

case 'antiprivate': {
const state = value?.toLowerCase()
if (!state || !['on', 'off'].includes(state)) {
return m.reply(`⚠️ Uso: ${usedPrefix}subconfig antiprivate <on/off>`)
}

config.antiPrivate = state === 'on'

if (!global.db.data.settings[conn.user.jid]) {
global.db.data.settings[conn.user.jid] = {}
}
global.db.data.settings[conn.user.jid].antiPrivate = state === 'on'

config.updatedAt = new Date().toISOString()
fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

if (global.subBotsData) {
global.subBotsData.set(configPath, config)
}

return m.reply(`✅ Anti-Private ${state === 'on' ? 'activado' : 'desactivado'}`)
}

case 'gponly': {
const state = value?.toLowerCase()
if (!state || !['on', 'off'].includes(state)) {
return m.reply(`⚠️ Uso: ${usedPrefix}subconfig gponly <on/off>`)
}

config.gponly = state === 'on'

if (!global.db.data.settings[conn.user.jid]) {
global.db.data.settings[conn.user.jid] = {}
}
global.db.data.settings[conn.user.jid].gponly = state === 'on'

config.updatedAt = new Date().toISOString()
fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

if (global.subBotsData) {
global.subBotsData.set(configPath, config)
}

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

conn.subConfig = defaultConfig

if (global.subBotsData) {
global.subBotsData.set(configPath, defaultConfig)
}

return m.reply('✅ Configuración restablecida a valores por defecto.')
}

default: {
return m.reply(`❌ Acción no reconocida.\nUsa ${usedPrefix}subconfig para ver opciones.`)
}
}
break
}

case 'subcmd': {
if (conn.user.jid === global.conn.user.jid) {
return m.reply('❌ Este comando solo funciona en SubBots.')
}

try {
const sessionId = conn.user.jid.split('@')[0]
const configPath = path.join(global.jadi, sessionId, 'config.json')
const config = fs.existsSync(configPath) 
  ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  : { prefix: global.prefix }

const botPrefix = config.prefix || global.prefix
const botName = config.name || conn.user.name || 'SubBot'

const availableCommands = []
const excludedCategories = ['owner', 'fernando', 'jadibot']

for (const [key, plugin] of Object.entries(global.plugins)) {
  if (!plugin.help || !plugin.tags) continue
  
  const isBlocked = plugin.tags?.some(tag => excludedCategories.includes(tag))
  if (isBlocked) continue
  
  if (plugin.owner && !conn.isOwner) continue
  if (plugin.rowner && !conn.isROwner) continue
  if (plugin.premium && !conn.isPrems) continue
  
  let cmdName = ''
  if (Array.isArray(plugin.command)) {
    cmdName = plugin.command[0]
  } else if (typeof plugin.command === 'string') {
    cmdName = plugin.command
  } else if (plugin.command instanceof RegExp) {
    cmdName = plugin.command.toString()
  }
  
  if (cmdName) {
    availableCommands.push({
      name: cmdName,
      description: plugin.help[0] || 'Sin descripción',
      category: plugin.tags[0] || 'general'
    })
  }
}

const categorized = {}
availableCommands.forEach(cmd => {
  if (!categorized[cmd.category]) {
    categorized[cmd.category] = []
  }
  categorized[cmd.category].push(cmd)
})

let message = `🤖 *COMANDOS DISPONIBLES - ${botName}*\n\n`
message += `🔧 *Prefijo actual:* \`${botPrefix}\`\n`
message += `📊 *Total comandos:* ${availableCommands.length}\n\n`

for (const [category, commands] of Object.entries(categorized)) {
  message += `📁 *${category.toUpperCase()}* (${commands.length})\n`
  
  const displayed = commands.slice(0, 5)
  displayed.forEach(cmd => {
    message += `├ ${botPrefix}${cmd.name}\n`
  })
  
  if (commands.length > 5) {
    message += `└ ... y ${commands.length - 5} más\n`
  }
  
  message += '\n'
}

message += `📌 *Uso:*\n`
message += `• ${botPrefix}subconfig - Configurar tu SubBot\n`
message += `• ${botPrefix}botlist - Ver bots activos\n`
message += `⚠️ *Nota:* Usa el comando seguido del nombre para más info.`

await conn.sendMessage(m.chat, { 
  text: message,
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    mentionedJid: [m.sender]
  }
}, { quoted: m })

} catch (error) {
console.error(error)
m.reply('❌ Error al cargar comandos.')
}
break
}

}

} catch (error) {
await m.react('✖️')
conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${error.message || error}`, m)
}
}

handler.command = ['self', 'public', 'antiprivate', 'gponly', 'sologp', 'join', 'salir', 'leave', 'logout', 'reload', 'subconfig', 'subcmd']
handler.help = ['self', 'public', 'antiprivate', 'gponly', 'sologp', 'join', 'salir', 'leave', 'logout', 'reload', 'subconfig', 'subcmd']
handler.tags = ['socket']
handler.fernando = true

export default handler