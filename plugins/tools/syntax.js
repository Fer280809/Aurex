import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

var handler = async (m, { usedPrefix, command }) => {
try {
await m.react('🕒')
conn.sendPresenceUpdate('composing', m.chat)

const pluginsDir = path.join(__dirname, '..', 'plugins') // Ruta absoluta a plugins
let response = `❀ *Revisión de Syntax Errors:*\n\n`
let hasErrors = false
let totalFiles = 0
let filesWithErrors = 0

// Función recursiva para buscar archivos .js en todas las subcarpetas
function getAllJSFiles(dir) {
let results = []
const items = fs.readdirSync(dir, { withFileTypes: true })
  
for (const item of items) {
const fullPath = path.join(dir, item.name)
    
if (item.isDirectory()) {
// Si es una carpeta, buscar recursivamente
results = results.concat(getAllJSFiles(fullPath))
} else if (item.isFile() && item.name.endsWith('.js')) {
// Si es un archivo .js, añadirlo a los resultados
results.push(fullPath)
}
}
return results
}

// Obtener todos los archivos .js recursivamente
const allFiles = getAllJSFiles(pluginsDir)
totalFiles = allFiles.length

if (totalFiles === 0) {
response += '⚠️ No se encontraron archivos .js en la carpeta plugins\n'
await conn.reply(m.chat, response, m)
await m.react('⚠️')
return
}

response += `📁 *Total de archivos:* ${totalFiles}\n\n`

// Verificar cada archivo
for (const filePath of allFiles) {
// Obtener ruta relativa para mostrar
const relativePath = path.relative(pluginsDir, filePath)
const displayPath = relativePath.startsWith('..') ? filePath : `plugins/${relativePath}`

try {
// Intentar importar el archivo
await import(`file://${filePath}`)
} catch (error) {
hasErrors = true
filesWithErrors++
// Formatear mejor el mensaje de error
const errorMessage = error.message.split('\n')[0] // Tomar solo la primera línea
response += `⚠️ *Error en:* ${displayPath}\n`
response += `   ↳ *Mensaje:* ${errorMessage}\n\n`
}
}

// Resumen final
response += `\n📊 *Resumen:*\n`
response += `• Total de archivos: ${totalFiles}\n`
response += `• Archivos con errores: ${filesWithErrors}\n`
response += `• Archivos sin errores: ${totalFiles - filesWithErrors}\n\n`

if (!hasErrors) {
response += '✅ ¡Perfecto! Todos los archivos están libres de errores de sintaxis.'
await m.react('✔️')
} else {
response += '⚠️ Se encontraron algunos errores. Revisa los detalles arriba.'
await m.react('⚠️')
}

await conn.reply(m.chat, response, m)

} catch (err) {
console.error(err)
await m.react('✖️') 
await conn.reply(m.chat, `❌ *Error en el comando syntax*\n\n> ${err.message}\n\nUsa *${usedPrefix}report* para informar este problema.`, m)
}}

handler.command = ['syntax', 'detectar', 'errores', 'syntaxcheck']
handler.help = ['syntax']
handler.tags = ['tools']
handler.rowner = true

export default handler