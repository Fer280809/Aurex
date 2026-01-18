// Ejemplo de plugin para /plugins/invitacion.js
import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

let handler = async (m, { conn, usedPrefix }) => {
    let jid = m.chat // o m.sender para privado
    let textoACopiar = 'https://chat.whatsapp.com/ABC123xyz' // Tu enlace o texto aquí

    const mensajeConBoton = {
        interactiveMessage: {
            header: {
                title: '¡Únete a nuestro grupo!'
            },
            body: {
                text: 'Presiona el botón de abajo para copiar el enlace de invitación y pégalo en tu navegador.'
            },
            footer: {
                text: 'Asta Bot'
            },
            // AQUÍ ESTÁ EL BOTÓN DE COPIAR
            nativeFlowMessage: {
                buttons: [{
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📋 Copiar Enlace',
                        id: 'copy_invitacion_001',
                        copy_code: textoACopiar // Esto es lo que se copia
                    })
                }]
            }
        }
    }

    await conn.sendMessage(jid, mensajeConBoton, { quoted: m })
}

handler.help = ['invitar']
handler.tags = ['grupo']
handler.command = /^(invitar|invitelink)$/i

export default handler