import { smsg } from "./lib/simple.js"
import { fileURLToPath } from "url"
import path, { join } from "path"
import fs, { unwatchFile, watchFile } from "fs"
import chalk from "chalk"
import ws from "ws"
import { jidNormalizedUser, areJidsSameUser } from '@whiskeysockets/baileys'

const isNumber = x => typeof x === "number" && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))

export async function handler(chatUpdate) {
    this.msgqueue = this.msgqueue || []
    this.uptime = this.uptime || Date.now()

    if (!chatUpdate) return
    await this.pushMessage(chatUpdate.messages).catch(console.error)

    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return

    if (!global.db.data) await global.loadDatabase()

    try {
        m = smsg(this, m) || m
        if (!m) return
        m.exp = 0

        // INICIALIZACIÓN DE DATOS
        const user = global.db.data.users[m.sender] = global.db.data.users[m.sender] || {
            name: m.name || "",
            exp: 0, coin: 0, bank: 0, level: 0, health: 100,
            genre: "", birth: "", marry: "", description: "",
            packstickers: null, premium: false, premiumTime: 0,
            banned: false, bannedReason: "", commands: 0,
            afk: -1, afkReason: "", warn: 0
        }

        const chat = global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {
            isBanned: false, isMute: false, welcome: false,
            sWelcome: "", sBye: "", detect: true, primaryBot: null,
            modoadmin: false, antiLink: true, nsfw: false,
            economy: true, gacha: true,
            mutes: {}
        }

        const settings = global.db.data.settings[this.user.jid] = global.db.data.settings[this.user.jid] || {
            self: false, restrict: true, jadibotmd: true,
            antiPrivate: false, gponly: false
        }

        // ============================================
        // SISTEMA DE MUTE - CORREGIDO
        // ============================================
        if (m.chat && m.chat.endsWith('@g.us') && !m.isBaileys && m.sender && !m.key.fromMe) {
            if (!chat.mutes) chat.mutes = {}
            
            const muteData = chat.mutes[m.sender]
            
            if (muteData) {
                const now = Date.now()
                let shouldDeleteMute = false
                
                if (muteData.expiresAt) {
                    if (muteData.expiresAt <= now) {
                        shouldDeleteMute = true
                    }
                }
                
                if (shouldDeleteMute) {
                    delete chat.mutes[m.sender]
                } else {
                    // INTENTAR ELIMINAR MENSAJE DEL USUARIO MUTEADO
                    try {
                        if (m.isGroup) {
                            let groupMetadata
                            if (global.cachedGroupMetadata) {
                                groupMetadata = await global.cachedGroupMetadata(m.chat).catch(() => null)
                            }
                            if (!groupMetadata) {
                                groupMetadata = await this.groupMetadata(m.chat).catch(() => null)
                            }
                            
                            if (groupMetadata) {
                                const participants = Array.isArray(groupMetadata.participants) ? groupMetadata.participants : []
                                const botGroup = participants.find(p => areJidsSameUser(p.id, this.user.jid)) || {}
                                const isBotAdmin = botGroup.admin === 'admin' || botGroup.admin === 'superadmin' || botGroup.admin === true
                                
                                if (isBotAdmin) {
                                    await this.sendMessage(m.chat, {
                                        delete: {
                                            remoteJid: m.chat,
                                            fromMe: false,
                                            id: m.key.id,
                                            participant: m.sender
                                        }
                                    }).catch(() => null)
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Error eliminando mensaje muteado:', e)
                    }
                    
                    // NOTIFICACIÓN CON LÍMITE DE TIEMPO
                    const lastNotification = global.muteNotifCache = global.muteNotifCache || {}
                    const key = `${m.chat}_${m.sender}`
                    
                    if (!lastNotification[key] || (now - lastNotification[key] > 30000)) {
                        let timeLeft = ''
                        if (muteData.expiresAt) {
                            const remaining = muteData.expiresAt - now
                            if (remaining > 0) {
                                timeLeft = `\n⏳ Tiempo restante: ${formatMuteTime(remaining)}`
                            }
                        }
                        
                        try {
                            await this.sendMessage(m.chat, {
                                text: `🔇 @${m.sender.split('@')[0]} está silenciado y no puede enviar mensajes.${timeLeft}`,
                                mentions: [m.sender]
                            }).catch(() => null)
                            
                            lastNotification[key] = now
                        } catch (e) {
                            console.error('Error en notificación de mute:', e)
                        }
                    }
                    
                    return
                }
            }
        }
        // ============================================

        if (typeof m.text !== "string") m.text = ""

        // ACTUALIZAR NOMBRE DEL USUARIO
        try {
            const newName = m.pushName || await this.getName(m.sender)
            if (typeof newName === "string" && newName.trim() && newName !== user.name) {
                user.name = newName
            }
        } catch {}

        // VERIFICACIONES DE PERMISOS
        const isROwner = [...global.owner].map(v => v.replace(/\D/g, "") + "@s.whatsapp.net").includes(m.sender)
        const isOwner = isROwner || m.fromMe
        const isPrems = isROwner || global.prems.map(v => v.replace(/\D/g, "") + "@s.whatsapp.net").includes(m.sender) || user.premium
        const isOwners = [this.user.jid, ...global.owner.map(v => v + "@s.whatsapp.net")].includes(m.sender)

        if (settings.self && !isOwners) return
        if (settings.gponly && !isOwners && !m.chat.endsWith('g.us') && 
            !/code|p|ping|qr|estado|status|infobot|botinfo|report|reportar|invite|join|logout|suggest|help|menu/gim.test(m.text)) return

        // SISTEMA DE COLA DE MENSAJES
        if (global.opts?.queque && m.text && !isPrems) {
            const queue = this.msgqueue
            queue.push(m.id || m.key.id)
            setTimeout(() => {
                const index = queue.indexOf(m.id || m.key.id)
                if (index > -1) queue.splice(index, 1)
            }, 5000)
        }

        if (m.isBaileys) return
        m.exp += Math.ceil(Math.random() * 10)

        // DETECCIÓN DE ADMINISTRADORES
        let groupMetadata = {}
        let participants = []

        if (m.isGroup) {
            try {
                if (global.cachedGroupMetadata) {
                    groupMetadata = await global.cachedGroupMetadata(m.chat).catch(() => null)
                }
                if (!groupMetadata) {
                    groupMetadata = await this.groupMetadata(m.chat).catch(() => null) || {}
                }
                participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []
            } catch (e) {
                console.error('Error obteniendo metadata del grupo:', e)
            }
        }

        const decodeJid = (j) => this.decodeJid(j)
        const normJid = (j) => jidNormalizedUser(decodeJid(j))

        const userGroup = m.isGroup ? participants.find(p => areJidsSameUser(normJid(p.jid || p.id), normJid(m.sender))) || {} : {}
        const botGroup = m.isGroup ? participants.find(p => areJidsSameUser(normJid(p.jid || p.id), normJid(this.user.jid))) || {} : {}

        const isRAdmin = userGroup?.admin === 'superadmin'
        const isAdmin = isRAdmin || userGroup?.admin === 'admin' || userGroup?.admin === true
        const isBotAdmin = botGroup?.admin === 'admin' || botGroup?.admin === 'superadmin' || botGroup?.admin === true

        // PROCESAR PLUGINS
        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "./plugins")

        for (const name in global.plugins) {
            const plugin = global.plugins[name]
            if (!plugin || plugin.disabled) continue

            const __filename = join(___dirname, name)

            // PLUGIN.ALL
            if (typeof plugin.all === "function") {
                try {
                    await plugin.all.call(this, m, { chatUpdate, __dirname: ___dirname, __filename, user, chat, settings })
                } catch (err) {
                    console.error(err)
                }
            }

            if (!global.opts?.restrict && plugin.tags?.includes("admin")) continue

            // MANEJO DE PREFIJOS
            const pluginPrefix = plugin.customPrefix || conn.prefix || global.prefix
            let match = null

            if (pluginPrefix instanceof RegExp) {
                match = [pluginPrefix.exec(m.text), pluginPrefix]
            } else if (Array.isArray(pluginPrefix)) {
                match = pluginPrefix.map(prefix => {
                    const regex = prefix instanceof RegExp ? prefix : new RegExp(prefix.toString().replace(/[|\\{}()[\]^$+*?.]/g, "\\$&"))
                    return [regex.exec(m.text), regex]
                }).find(p => p[0])
            } else if (typeof pluginPrefix === "string") {
                const regex = new RegExp(pluginPrefix.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&"))
                match = [regex.exec(m.text), regex]
            }

            if (!match) continue

            // BEFORE HOOK
            if (typeof plugin.before === "function") {
                if (await plugin.before.call(this, m, {
                    match, conn: this, participants, groupMetadata,
                    userGroup, botGroup, isROwner, isOwner, isRAdmin,
                    isAdmin, isBotAdmin, isPrems, chatUpdate,
                    __dirname: ___dirname, __filename, user, chat, settings
                })) continue
            }

            if (typeof plugin !== "function") continue

            // DETERMINAR PREFIJO USADO
            let usedPrefix = (match[0] || "")[0] || (global.sinprefix ? '' : undefined)
            if (usedPrefix === undefined) continue

            const noPrefix = m.text.replace(usedPrefix, "")
            let [command, ...args] = noPrefix.trim().split(" ").filter(v => v)
            command = (command || "").toLowerCase()

            // VERIFICAR SI EL COMANDO COINCIDE
            let isAccept = false
            if (plugin.command instanceof RegExp) {
                isAccept = plugin.command.test(command)
            } else if (Array.isArray(plugin.command)) {
                isAccept = plugin.command.some(cmd => 
                    cmd instanceof RegExp ? cmd.test(command) : cmd === command)
            } else if (typeof plugin.command === "string") {
                isAccept = plugin.command === command
            }

            if (!isAccept) continue

            m.plugin = name
            global.comando = command
            user.commands = (user.commands || 0) + 1

            // VERIFICAR BANEOS
            if (chat.isBanned && !isROwner) {
                const aviso = `⚠️ El bot *${global.botname}* está desactivado en este grupo.\n\n> 🔹 Un *administrador* puede activarlo usando:\n> » *${usedPrefix}bot on*`
                await m.reply(aviso)
                return
            }

            if (user.banned && !isROwner) {
                const mensaje = `🚫 *Acceso Denegado*\nꕙ Has sido *baneado/a* y no puedes usar comandos.\n\n> ⚡ *Razón:* ${user.bannedReason}`
                await m.reply(mensaje)
                return
            }

            // VERIFICAR PERMISOS DEL COMANDO
            const adminMode = chat.modoadmin
            const requiresAdmin = plugin.botAdmin || plugin.admin || plugin.group

            if (adminMode && !isOwner && m.isGroup && !isAdmin && requiresAdmin) return
            if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) return global.dfail("owner", m, this)
            if (plugin.rowner && !isROwner) return global.dfail("rowner", m, this)
            if (plugin.owner && !isOwner) return global.dfail("owner", m, this)
            if (plugin.premium && !isPrems) return global.dfail("premium", m, this)
            if (plugin.group && !m.isGroup) return global.dfail("group", m, this)
            if (plugin.botAdmin && !isBotAdmin) return global.dfail("botAdmin", m, this)
            if (plugin.admin && !isAdmin) return global.dfail("admin", m, this)
            if (plugin.private && m.isGroup) return global.dfail("private", m, this)

            m.isCommand = true
            m.exp += plugin.exp ? parseInt(plugin.exp) : 10

            // EJECUTAR EL PLUGIN
            try {
                await plugin.call(this, m, {
                    match, usedPrefix, noPrefix, args,
                    command, text: args.join(" "), conn: this,
                    participants, groupMetadata, userGroup, botGroup,
                    isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin,
                    isPrems, chatUpdate, __dirname: ___dirname,
                    __filename, user, chat, settings
                })
            } catch (err) {
                m.error = err
                console.error(err)
            } finally {
                if (typeof plugin.after === "function") {
                    try {
                        await plugin.after.call(this, m, {
                            match, usedPrefix, noPrefix, args,
                            command, text: args.join(" "), conn: this,
                            participants, groupMetadata, userGroup, botGroup,
                            isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin,
                            isPrems, chatUpdate, __dirname: ___dirname,
                            __filename, user, chat, settings
                        })
                    } catch (err) {
                        console.error(err)
                    }
                }
            }
        }
    } catch (err) {
        console.error(err)
    } finally {
        // LIMPIAR COLA DE MENSAJES
        if (global.opts?.queque && m?.text) {
            const index = this.msgqueue.indexOf(m.id || m.key.id)
            if (index > -1) this.msgqueue.splice(index, 1)
        }

        // ACTUALIZAR EXPERIENCIA DEL USUARIO
        if (m?.sender && global.db.data.users[m.sender]) {
            global.db.data.users[m.sender].exp += m.exp || 0
        }

        // IMPRIMIR MENSAJE
        try {
            if (!global.opts?.noprint) {
                await import("./lib/print.js").then(mod => mod.default(m, this))
            }
        } catch (err) {
            console.warn(err)
        }
    }
}

// FUNCIÓN PARA FORMATEAR TIEMPO DE MUTE
function formatMuteTime(ms) {
    if (ms < 1000) return '0 segundos'

    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / (1000 * 60)) % 60)
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
    const days = Math.floor(ms / (1000 * 60 * 60 * 24))

    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (seconds > 0) parts.push(`${seconds}s`)

    return parts.join(' ') || '0s'
}

// FUNCIÓN DE FALLO
global.dfail = (type, m, conn) => {
    const messages = {
        rowner: `💠 *Acceso denegado*\nEl comando *${global.comando}* solo puede ser usado por los *creadores del bot*.`,
        owner: `💠 *Acceso denegado*\nEl comando *${global.comando}* solo puede ser usado por los *desarrolladores del bot*.`,
        premium: `⭐ *Exclusivo Premium*\nEl comando *${global.comando}* solo puede ser usado por *usuarios premium*.`,
        group: `👥 *Solo en grupos*\nEl comando *${global.comando}* solo puede ejecutarse dentro de un *grupo*.`,
        private: `📩 *Solo privado*\nEl comando *${global.comando}* solo puede usarse en *chat privado* con el bot.`,
        admin: `⚠️ *Requiere permisos de admin*\nEl comando *${global.comando}* solo puede ser usado por los *administradores del grupo*.`,
        botAdmin: `🤖 *Necesito permisos*\nPara ejecutar *${global.comando}*, el bot debe ser *administrador del grupo*.`,
        restrict: `⛔ *Funcionalidad desactivada*\nEsta característica está *temporalmente deshabilitada*.`
    }

    if (messages[type]) {
        conn.reply(m.chat, messages[type], m).then(_ => {
            try {
                m.react?.('✖️')
            } catch {}
        })
    }
}

// WATCH PARA RECARGAR AUTOMÁTICAMENTE
let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
    unwatchFile(file)
    console.log(chalk.magenta("Se actualizó 'handler.js'"))
    if (global.reloadHandler) console.log(await global.reloadHandler())
})