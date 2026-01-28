let handler = async (m, { conn, usedPrefix }) => {
  let totalreg = Object.keys(global.db.data.users).length;
  let totalCommands = Object.values(global.plugins).filter(
    (v) => v.help && v.tags
  ).length;
  let libreria = 'Baileys';
  let vs = '1.3';
  let userId = m.sender;

  // URL de tu imagen (RAW de GitHub)
  let mediaUrl = 'https://raw.githubusercontent.com/Fer280809/Asta_bot/main/lib/catalogo.jpg';
  
  // Tu web para el link preview
  let webUrl = 'https://study-bot.xo.je';

  let infoText = `╭─━━━━━━━━━━━━━━━─╮
│ 🎭 ¡Hola @${userId.split('@')[0]}! 💖
╰─━━━━━━━━━━━━━━━─╯

Me llamo『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡

╭─═⊰ 📡 𝐄𝐒𝐓𝐀𝐃𝐎 𝐀𝐂𝐓𝐈𝐕𝐎
│ 🤖 Estado: ${(conn.user.jid == global.conn.user.jid ? '🟢 PREMIUM' : '🔗 prem-ʙᴏᴛ')}
│ 👥 Users: 『${totalreg.toLocaleString()}』🔥
│ 🛠️ Comandos: 『${totalCommands}』⚙️
│ 📅 Librería » ${libreria}
│ 🌍 Servidor: México 🇲🇽
│ 📡 Ping: Online ✅
│ 💾 Version: ${vs}
│ 🔒 Modo: ${(conn.user.jid == global.conn.user.jid ? '🔐 PRIVADO' : '🔓 PUBLICO')}
╰───────────────╯

*Creador 𝕱𝖊𝖗𝖓𝖆𝖓𝖉𝖔 👑*
Selecciona una opción:`;

  try {
    // OPCIÓN 1: Usando interactiveMessage (formato moderno tipo tarjeta)
    await conn.relayMessage(m.chat, {
      interactiveMessage: {
        header: {
          title: '『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡',
          hasMediaAttachment: true,
          ...(await conn.prepareMessageMedia(mediaUrl, 'image'))
        },
        body: {
          text: infoText
        },
        footer: {
          text: "Powered by study-bot.xo.je"
        },
        nativeFlowMessage: {
          buttons: [
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: "📜 Menú Principal",
                sections: [
                  {
                    title: "Opciones Disponibles",
                    highlight_label: "Nuevo",
                    rows: [
                      {
                        header: "📜 Menú",
                        title: "Ver comandos",
                        description: "Lista completa de comandos",
                        id: usedPrefix + "menu2"
                      },
                      {
                        header: "📌 Actualizaciones",
                        title: "Novedades",
                        description: "Últimas actualizaciones del bot",
                        id: usedPrefix + "nuevos"
                      },
                      {
                        header: "🤖 Sup-Bot",
                        title: "Crear sub-bot",
                        description: "Genera tu propio bot",
                        id: usedPrefix + "code"
                      },
                      {
                        header: "👑 Creador",
                        title: "Contacto",
                        description: "Hablar con Fernando",
                        id: usedPrefix + "creador"
                      },
                      {
                        header: "➕ Menu +18",
                        title: "Contenido adulto",
                        description: "Comandos NSFW",
                        id: usedPrefix + "menu+"
                      }
                    ]
                  }
                ]
              })
            },
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "🌐 Visitar Web",
                url: webUrl,
                merchant_url: webUrl
              })
            }
          ]
        }
      }
    }, { quoted: m });

  } catch (e1) {
    console.error('Error con interactiveMessage:', e1);
    
    try {
      // OPCIÓN 2: Usando templateMessage con URL externa (más compatible)
      await conn.sendMessage(m.chat, {
        templateMessage: {
          hydratedTemplate: {
            hydratedContentText: infoText,
            hydratedFooterText: "『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡ | study-bot.xo.je",
            hydratedButtons: [
              {
                urlButton: {
                  displayText: "🌐 Visitar Web",
                  url: webUrl
                }
              },
              {
                quickReplyButton: {
                  displayText: "📜 Menú",
                  id: usedPrefix + "menu2"
                }
              },
              {
                quickReplyButton: {
                  displayText: "👑 Creador",
                  id: usedPrefix + "creador"
                }
              }
            ],
            imageMessage: await conn.prepareMessageMedia(mediaUrl, 'image').then(m => m.imageMessage)
          }
        },
        mentions: [userId]
      }, { quoted: m });

    } catch (e2) {
      console.error('Error con templateMessage:', e2);
      
      // OPCIÓN 3: Fallback - enviar como link preview tradicional
      try {
        await conn.sendMessage(m.chat, {
          text: infoText + `\n\n🔗 ${webUrl}`,
          contextInfo: {
            externalAdReply: {
              title: "『 𝕬𝖘𝖙𝖆-𝕭𝕭𝖔𝖙 』⚡",
              body: "Click para visitar nuestra web",
              thumbnailUrl: mediaUrl,
              sourceUrl: webUrl,
              mediaType: 1,
              showAdAttribution: true,
              renderLargerThumbnail: true
            },
            mentionedJid: [userId]
          }
        }, { quoted: m });

      } catch (e3) {
        // OPCIÓN 4: Último recurso - mensaje simple con botones
        let buttons = [
          { buttonId: usedPrefix + 'menu2', buttonText: { displayText: '📜 Menú' }, type: 1 },
          { buttonId: usedPrefix + 'nuevos', buttonText: { displayText: '📌 Actualizaciones' }, type: 1 },
          { buttonId: usedPrefix + 'code', buttonText: { displayText: '🤖 Sup-Bot' }, type: 1 },
          { buttonId: usedPrefix + 'creador', buttonText: { displayText: '👑 CREADOR' }, type: 1 },
          { buttonId: usedPrefix + 'menu+', buttonText: { displayText: '➕ Menu +18' }, type: 1 }
        ];

        await conn.sendMessage(m.chat, {
          image: { url: mediaUrl },
          caption: infoText + `\n\n🔗 Web: ${webUrl}`,
          footer: "『 𝕬𝖘𝖙𝖆-𝕭𝖔𝖙 』⚡",
          buttons: buttons,
          headerType: 4,
          mentions: [userId]
        }, { quoted: m });
      }
    }
  }
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menú', 'menu', 'help'];

export default handler;
