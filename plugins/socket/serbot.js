const { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = (await import("@whiskeysockets/baileys"))
import qrcode from "qrcode"
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import util from 'util'
import * as ws from 'ws'
const { child, spawn, exec } = await import('child_process')
const { CONNECTING } = ws
import { makeWASocket } from '../../lib/simple.js'
import { fileURLToPath } from 'url'

let crm1 = "Y2QgcGx1Z2lucy"
let crm2 = "A7IG1kNXN1b"
let crm3 = "CBpbmZvLWRvbmFyLmpz"
let crm4 = "IF9hdXRvcmVzcG9uZGVyLmpzIGluZm8tYm90Lmpz"
let drm1 = ""
let drm2 = ""

const imagenSerBot = 'https://files.catbox.moe/gptlxc.jpg'

let rtx = `╭─〔 💻 𝘼𝙎𝙏𝘼 𝘽𝙊𝙏 • 𝙈𝙊𝘿𝙊 𝙌𝙍 〕─╮
│
│  📲 Escanea este *QR* desde otro celular o PC
│  para convertirte en un *Sub-Bot Temporal* de Asta.
│
│  1️⃣  Pulsa los ⋮ tres puntos arriba a la derecha
│  2️⃣  Ve a *Dispositivos vinculados*
│  3️⃣  Escanea el QR y ¡listo! ⚡
│
│  ⏳  *Expira en 45 segundos.*
╰───────────────────────`

let rtx2 = `╭─[ 💻 𝘼𝙎𝙏𝘼 𝘽𝙊𝙏 • 𝙈𝙊𝘿𝙊 𝘾𝙊𝘿𝙀 ]─╮
│
│  🧠  Este es el *Modo CODE* de Asta Bot.
│  Escanea el *QR* desde otro celular o PC
│  para convertirte en un *Sub-Bot Temporal*.
│
│  1️⃣  Pulsa los ⋮ tres puntos arriba a la derecha
│  2️⃣  Entra en *Dispositivos vinculados*
│  3️⃣  Escanea el QR y ¡listo! ⚡
│
│  ⏳  *Expira en 45 segundos.*
╰────────────────────────╯`

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const AstaJBOptions = {}

if (global.conns instanceof Array) console.log()
else global.conns = []

// Registrar SubBots activos
if (!global.activeSubBots) global.activeSubBots = new Map()
if (!global.subBotsData) global.subBotsData = new Map()

function isSubBotConnected(jid) { 
    return global.conns.some(sock => sock?.user?.jid && sock.user.jid.split("@")[0] === jid.split("@")[0]) 
}

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
    if (!globalThis.db.data.settings[conn.user.jid].jadibotmd) return m.reply(`ꕥ El Comando *${command}* está desactivado temporalmente.`)
    
    // Verificar límite de SubBots
    const socklimit = global.conns.filter(sock => sock?.user).length
    if (socklimit >= global.supConfig?.maxSubBots || 100) {
        return m.reply(`ꕥ Límite alcanzado: ${socklimit}/${global.supConfig?.maxSubBots || 100} SubBots activos.`)
    }
    
    let time = global.db.data.users[m.sender].Subs + 120000
    if (new Date - global.db.data.users[m.sender].Subs < 120000) return conn.reply(m.chat, `ꕥ Debes esperar ${msToTime(time - new Date())} para volver a vincular un *Sub-Bot.*`, m)
    
    let mentionedJid = await m.mentionedJid
    let who = mentionedJid && mentionedJid[0] ? mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
    let id = `${who.split`@`[0]}`
    
    // Verificar si ya existe una sesión activa para este usuario
    if (isSubBotConnected(who)) {
        return m.reply(`⚠️ Ya tienes un SubBot activo. Usa *${usedPrefix}kill ${id}* para eliminarlo primero.`)
    }
    
    let pathAstaJadiBot = path.join(`./${global.jadi || 'Sessions/SubBot'}/`, id)
    
    // Limpiar sesión anterior si existe
    if (fs.existsSync(pathAstaJadiBot)) {
        try {
            fs.rmSync(pathAstaJadiBot, { recursive: true, force: true })
        } catch (e) {
            console.error('Error limpiando sesión anterior:', e)
        }
    }
    
    if (!fs.existsSync(pathAstaJadiBot)){
        fs.mkdirSync(pathAstaJadiBot, { recursive: true })
    }
    
    AstaJBOptions.pathAstaJadiBot = pathAstaJadiBot
    AstaJBOptions.m = m
    AstaJBOptions.conn = conn
    AstaJBOptions.args = args
    AstaJBOptions.usedPrefix = usedPrefix
    AstaJBOptions.command = command
    AstaJBOptions.fromCommand = true
    AstaJBOptions.userId = id
    
    AstaJadiBot(AstaJBOptions)
    global.db.data.users[m.sender].Subs = new Date * 1
}

handler.help = ['qr', 'code']
handler.tags = ['serbot']
handler.command = ['qr', 'code']
export default handler 

export async function AstaJadiBot(options) {
    let { pathAstaJadiBot, m, conn, args, usedPrefix, command, userId } = options
    
    if (command === 'code') {
        command = 'qr'
        args.unshift('code')
    }
    
    const mcode = args[0] && /(--code|code)/.test(args[0].trim()) ? true : args[1] && /(--code|code)/.test(args[1].trim()) ? true : false
    let txtCode, codeBot, txtQR
    
    if (mcode) {
        args[0] = args[0].replace(/^--code$|^code$/, "").trim()
        if (args[1]) args[1] = args[1].replace(/^--code$|^code$/, "").trim()
        if (args[0] == "") args[0] = undefined
    }
    
    const pathCreds = path.join(pathAstaJadiBot, "creds.json")
    
    if (!fs.existsSync(pathAstaJadiBot)){
        fs.mkdirSync(pathAstaJadiBot, { recursive: true })
    }
    
    try {
        args[0] && args[0] != undefined ? fs.writeFileSync(pathCreds, JSON.stringify(JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")), null, '\t')) : ""
    } catch {
        conn.reply(m.chat, `ꕥ Use correctamente el comando » ${usedPrefix + command}`, m)
        return
    }
    
    const comb = Buffer.from(crm1 + crm2 + crm3 + crm4, "base64")
    exec(comb.toString("utf-8"), async (err, stdout, stderr) => {
        const drmer = Buffer.from(drm1 + drm2, `base64`)
        let { version, isLatest } = await fetchLatestBaileysVersion()
        
        const msgRetry = (MessageRetryMap) => { }
        const msgRetryCache = new NodeCache()
        const { state, saveState, saveCreds } = await useMultiFileAuthState(pathAstaJadiBot)
        
        const connectionOptions = {
            logger: pino({ level: "fatal" }),
            printQRInTerminal: false,
            auth: { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) 
            },
            msgRetry,
            msgRetryCache, 
            browser: ['Windows', 'Firefox'],
            version: version,
            generateHighQualityLinkPreview: true
        }
        
        let sock = makeWASocket(connectionOptions)
        sock.isInit = false
        let isInit = true

        // ============= CONFIGURACIÓN INICIAL DEL SUBBOT =============
        const defaultConfig = {
            name: `SubBot-${userId}`,
            prefix: global.prefix.toString(),
            sinprefix: false, // Por defecto requiere prefijo
            mode: 'public',
            antiPrivate: false,
            gponly: false,
            owner: m.sender,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            autoReconnect: global.supConfig?.autoRestart || true,
            sessionTime: global.supConfig?.sessionTime || 60
        }

        const configPath = path.join(pathAstaJadiBot, 'config.json')
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
        sock.subConfig = defaultConfig
        
        // Crear archivo de estado
        const statePath = path.join(pathAstaJadiBot, 'state.json')
        const initialState = {
            jid: '',
            name: '',
            config: defaultConfig,
            lastConnected: new Date().toISOString(),
            createdAt: new Date().toISOString()
        }
        fs.writeFileSync(statePath, JSON.stringify(initialState, null, 2))

        // ============= GESTIÓN DE SESIONES =============
        // Función para guardar estado del SubBot
        const saveSubBotState = async () => {
            try {
                if (!sock.user || !sock.user.jid) return
                
                const sessionId = sock.user.jid.split('@')[0]
                const statePath = path.join(pathAstaJadiBot, 'state.json')
                
                const state = {
                    jid: sock.user.jid,
                    name: sock.user.name || sock.subConfig?.name,
                    config: sock.subConfig || defaultConfig,
                    authState: {
                        me: sock.authState?.creds?.me,
                        deviceId: sock.authState?.creds?.deviceId,
                        registered: sock.authState?.creds?.registered
                    },
                    lastConnected: new Date().toISOString(),
                    version: global.vs || '1.4'
                }
                
                fs.writeFileSync(statePath, JSON.stringify(state, null, 2))
                
                // Actualizar mapa global
                if (global.subBotsData) {
                    global.subBotsData.set(sessionId, state)
                }
                
            } catch (error) {
                console.error(chalk.red(`❌ Error guardando estado:`, error))
            }
        }

        // Función para limpiar sesión expirada
        const cleanupExpiredSession = async () => {
            try {
                const sessionAge = Date.now() - fs.statSync(pathAstaJadiBot).mtimeMs
                const ageMinutes = sessionAge / (1000 * 60)
                
                if (ageMinutes > (sock.subConfig?.sessionTime || 60)) {
                    console.log(chalk.yellow(`⏰ Sesión expirada: ${userId} (${Math.round(ageMinutes)} minutos)`))
                    
                    if (sock.ws && sock.ws.readyState === 1) {
                        sock.ws.close()
                    }
                    
                    // Eliminar archivos
                    if (fs.existsSync(pathAstaJadiBot)) {
                        fs.rmSync(pathAstaJadiBot, { recursive: true, force: true })
                    }
                    
                    // Eliminar de listas activas
                    if (sock.user?.jid && global.activeSubBots) {
                        global.activeSubBots.delete(sock.user.jid)
                    }
                    
                    const index = global.conns.indexOf(sock)
                    if (index > -1) global.conns.splice(index, 1)
                    
                    return true
                }
            } catch (error) {
                console.error('Error en limpieza de sesión:', error)
            }
            return false
        }

        // ============= TIMER DE LIMPIEZA AUTOMÁTICA =============
        setTimeout(async () => {
            if (!sock.user) {
                try { 
                    if (fs.existsSync(pathAstaJadiBot)) {
                        fs.rmSync(pathAstaJadiBot, { recursive: true, force: true }) 
                    }
                } catch {}
                try { sock.ws?.close() } catch {}
                sock.ev.removeAllListeners()
                let i = global.conns.indexOf(sock)
                if (i >= 0) global.conns.splice(i, 1)
                console.log(`[AUTO-LIMPIEZA] Sesión ${userId} eliminada - credenciales inválidos.`)
            }
        }, 60000)

        // ============= GESTIÓN DE CONEXIÓN =============
        async function connectionUpdate(update) {
            const { connection, lastDisconnect, isNewLogin, qr } = update
            
            if (isNewLogin) sock.isInit = false
            
            // Mostrar QR si está disponible
            if (qr && !mcode) {
                if (m?.chat) {
                    txtQR = await conn.sendMessage(m.chat, { 
                        image: await qrcode.toBuffer(qr, { scale: 8 }), 
                        caption: rtx.trim()
                    }, { quoted: m })
                    
                    await conn.sendMessage(m.chat, {
                        image: { url: imagenSerBot },
                        caption: '🤖 *Sub-Bot de Asta*\n\n¡Escanea el QR de arriba! ⬆️'
                    }, { quoted: m })
                }
                
                if (txtQR && txtQR.key) {
                    setTimeout(() => { 
                        conn.sendMessage(m.sender, { delete: txtQR.key })
                    }, 45000)
                }
                return
            } 
            
            // Mostrar código de pairing
            if (qr && mcode) {
                let secret = await sock.requestPairingCode((m.sender.split`@`[0]))
                secret = secret.match(/.{1,4}/g)?.join("-")
                
                txtCode = await conn.sendMessage(m.chat, {
                    image: { url: imagenSerBot },
                    caption: rtx2
                }, { quoted: m })
                
                codeBot = await m.reply(secret)
                console.log(chalk.cyan(`Código pairing: ${secret}`))
            }
            
            if (txtCode && txtCode.key) {
                setTimeout(() => { 
                    conn.sendMessage(m.sender, { delete: txtCode.key })
                }, 45000)
            }
            
            if (codeBot && codeBot.key) {
                setTimeout(() => { 
                    conn.sendMessage(m.sender, { delete: codeBot.key })
                }, 45000)
            }
            
            // Manejar cierre de conexión
            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
                
                // ============= CORRECCIÓN DEL ERROR fs.rmdirSync =============
                if (reason === DisconnectReason.badSession || reason === 405 || reason === 401) {
                    console.log(chalk.bold.magentaBright(
                        `\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n` +
                        `┆ La sesión (${userId}) fue cerrada. Credenciales no válidas.\n` +
                        `╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`
                    ))
                    
                    try {
                        // CORRECCIÓN: Usar fs.rmSync en lugar de fs.rmdirSync
                        if (fs.existsSync(pathAstaJadiBot)) {
                            fs.rmSync(pathAstaJadiBot, { recursive: true, force: true })
                            console.log(chalk.green(`✅ Sesión eliminada correctamente: ${userId}`))
                        }
                    } catch (error) {
                        console.error(chalk.red(`❌ Error eliminando sesión:`, error))
                    }
                    
                    // Eliminar de listas activas
                    if (sock.user?.jid && global.activeSubBots) {
                        global.activeSubBots.delete(sock.user.jid)
                    }
                    
                    let i = global.conns.indexOf(sock)
                    if (i >= 0) global.conns.splice(i, 1)
                }
                
                // Reconexión automática si está configurada
                else if ((reason === DisconnectReason.connectionClosed || 
                         reason === DisconnectReason.connectionLost || 
                         reason === DisconnectReason.timedOut) &&
                         sock.subConfig?.autoReconnect) {
                    
                    console.log(chalk.yellow(`🔄 Reconectando SubBot ${userId}...`))
                    
                    setTimeout(() => {
                        AstaJadiBot(options)
                    }, 5000)
                }
                
                // Notificar al dueño
                try {
                    if (options.fromCommand && m?.chat && sock.user?.jid) {
                        await conn.sendMessage(m.sender, {
                            text: `⚠️ Tu SubBot se ha desconectado.\n\n` +
                                  `• Razón: ${reason || 'Desconocida'}\n` +
                                  `• Para reconectar usa: *${usedPrefix}qr*\n` +
                                  `• O elimínalo con: *${usedPrefix}kill ${userId}*`
                        })
                    }
                } catch (error) {
                    console.error('Error enviando notificación:', error)
                }
            }
            
            // Conexión exitosa
            if (connection == `open`) {
                await saveSubBotState()
                
                // Registrar en listas activas
                if (sock.user?.jid) {
                    global.activeSubBots.set(sock.user.jid, {
                        socket: sock,
                        config: sock.subConfig,
                        createdAt: Date.now(),
                        lastActivity: Date.now()
                    })
                }
                
                // Actualizar configuración con datos reales
                if (sock.user && sock.subConfig) {
                    const sessionId = sock.user.jid.split('@')[0]
                    sock.subConfig.name = sock.user.name || sock.subConfig.name
                    
                    // Guardar configuración actualizada
                    const updatedConfig = {
                        ...sock.subConfig,
                        jid: sock.user.jid,
                        updatedAt: new Date().toISOString()
                    }
                    
                    fs.writeFileSync(
                        path.join(pathAstaJadiBot, 'config.json'),
                        JSON.stringify(updatedConfig, null, 2)
                    )
                    
                    // Cargar handler mejorado
                    try {
                        const handlerModule = await import('../../handler.js')
                        if (handlerModule && handlerModule.handler) {
                            sock.handler = handlerModule.handler.bind(sock)
                        }
                    } catch (error) {
                        console.error('Error cargando handler:', error)
                    }
                    
                    console.log(chalk.bold.cyanBright(
                        `\n❒⸺⸺⸺⸺【• SUB-BOT CONECTADO •】⸺⸺⸺⸺❒\n` +
                        `│\n` +
                        `│ ❍ Nombre: ${sock.user.name || 'Sin nombre'}\n` +
                        `│ ❍ JID: ${sock.user.jid}\n` +
                        `│ ❍ Dueño: ${m.sender}\n` +
                        `│ ❍ Config: Prefijo=${sock.subConfig.prefix}, SinPrefijo=${sock.subConfig.sinprefix}\n` +
                        `│\n` +
                        `❒⸺⸺⸺【• ACTIVO •】⸺⸺⸺❒`
                    ))
                    
                    // Notificar al usuario
                    if (m?.chat) {
                        await conn.sendMessage(m.chat, { 
                            text: `✅ *SubBot conectado exitosamente!*\n\n` +
                                  `• *Nombre:* ${sock.user.name || 'SubBot'}\n` +
                                  `• *JID:* ${sock.user.jid}\n` +
                                  `• *Configuración:*\n` +
                                  `  ├ Prefijo: \`${sock.subConfig.prefix}\`\n` +
                                  `  ├ Sin prefijo: ${sock.subConfig.sinprefix ? '✅' : '❌'}\n` +
                                  `  └ Modo: ${sock.subConfig.mode}\n\n` +
                                  `📝 *Comandos disponibles:*\n` +
                                  `• *${usedPrefix}config* - Configurar el SubBot\n` +
                                  `• *${usedPrefix}infobot* - Ver información\n` +
                                  `• *${usedPrefix}kill ${userId}* - Eliminar SubBot`,
                            mentions: [m.sender]
                        }, { quoted: m })
                    }
                }
                
                // Unirse a canales automáticamente
                try {
                    if (global.ch) {
                        for (const value of Object.values(global.ch)) {
                            if (typeof value === 'string' && value.endsWith('@newsletter')) {
                                await sock.newsletterFollow(value).catch(() => {})
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error uniéndose a canales:', e)
                }
            }
        }

        // ============= TIMER DE VERIFICACIÓN =============
        setInterval(async () => {
            if (!sock.user) {
                try { 
                    sock.ws?.close() 
                } catch (e) {}
                sock.ev.removeAllListeners()
                let i = global.conns.indexOf(sock)
                if (i < 0) return
                delete global.conns[i]
                global.conns.splice(i, 1)
            } else {
                // Verificar sesión expirada
                await cleanupExpiredSession()
            }
        }, 60000)

        // ============= CARGAR HANDLER MEJORADO =============
        let handler
        try {
            handler = await import('../../handler.js')
        } catch (e) {
            console.error('Error cargando handler:', e)
            return
        }

        let creloadHandler = async function (restatConn) {
            try {
                const Handler = await import(`../../handler.js?update=${Date.now()}`).catch(console.error)
                if (Object.keys(Handler || {}).length) handler = Handler
            } catch (e) {
                console.error('Error recargando handler: ', e)
            }
            
            if (restatConn) {
                const oldChats = sock.chats
                try { sock.ws.close() } catch { }
                sock.ev.removeAllListeners()
                sock = makeWASocket(connectionOptions, { chats: oldChats })
                isInit = true
            }
            
            if (!isInit) {
                sock.ev.off("messages.upsert", sock.handler)
                sock.ev.off("connection.update", sock.connectionUpdate)
                sock.ev.off('creds.update', sock.credsUpdate)
            }
            
            sock.handler = handler.handler.bind(sock)
            sock.connectionUpdate = connectionUpdate.bind(sock)
            sock.credsUpdate = saveCreds.bind(sock, true)
            sock.ev.on("messages.upsert", sock.handler)
            sock.ev.on("connection.update", sock.connectionUpdate)
            sock.ev.on("creds.update", sock.credsUpdate)
            isInit = false
            return true
        }
        
        creloadHandler(false)
    })
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function msToTime(duration) {
    var milliseconds = parseInt((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
    
    hours = (hours < 10) ? '0' + hours : hours
    minutes = (minutes < 10) ? '0' + minutes : minutes
    seconds = (seconds < 10) ? '0' + seconds : seconds
    
    return minutes + ' m y ' + seconds + ' s '
}