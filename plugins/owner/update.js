import fetch from "node-fetch"

let handler = async (m, { conn, usedPrefix }) => {
  try {
    // Verificar si es owner
    if (!global.owner.includes(m.sender.split('@')[0])) {
      return m.reply('🚫 Este comando solo está disponible para el owner del bot.')
    }

    const botDir = process.cwd()
    const repoUrl = 'https://github.com/Fer280809/Aurex.git' // Tu repositorio

    // Función para ejecutar comandos
    const execCmd = (cmd) => {
      return new Promise((resolve, reject) => {
        import('child_process').then(child_process => {
          child_process.exec(cmd, { cwd: botDir }, (error, stdout, stderr) => {
            if (error) reject(error)
            else resolve({ stdout, stderr })
          })
        }).catch(reject)
      })
    }

    await m.react('🕒')
    
    const msgInicial = await conn.sendMessage(m.chat, { 
      text: `🔄 *Iniciando actualización automática*\n\n📦 Repositorio: Fer280809/Aurex\n⏳ Verificando actualizaciones...` 
    }, { quoted: m })

    const backupDir = `${botDir}/backup_update_${Date.now()}`

    // Función para actualizar el mensaje
    const actualizarMensaje = async (texto) => {
      try {
        await conn.sendMessage(m.chat, { 
          text: texto, 
          edit: msgInicial.key 
        })
      } catch (e) {
        console.log('No se pudo editar mensaje:', e.message)
      }
    }

    // 1. Verificar si existe el directorio .git
    await actualizarMensaje(`🔄 *Actualizando bot*\n\n🔍 Verificando repositorio...`)
    
    try {
      await execCmd('git rev-parse --git-dir')
    } catch (e) {
      // No es un repositorio git, inicializar
      await actualizarMensaje(`🔄 *Actualizando bot*\n\n⚙️ Inicializando repositorio Git...`)
      try {
        await execCmd('git init')
        await execCmd(`git remote add origin ${repoUrl}`)
        await execCmd('git fetch origin')
        await execCmd('git checkout -b main origin/main')
        
        await m.react('✅')
        await actualizarMensaje(`✅ *Repositorio configurado*\n\n📦 Origen: Fer280809/Aurex\n🌿 Rama: main\n\n⚠️ Ejecuta *${usedPrefix}update* nuevamente para actualizar.`)
        return
      } catch (initError) {
        await m.react('❌')
        await actualizarMensaje(`❌ *Error al configurar repositorio*\n\n${initError.message}`)
        return
      }
    }

    // 2. Verificar que el remote correcto esté configurado
    try {
      const { stdout: remoteUrl } = await execCmd('git remote get-url origin')
      if (!remoteUrl.includes('Fer280809/Aurex')) {
        await execCmd('git remote remove origin')
        await execCmd(`git remote add origin ${repoUrl}`)
      }
    } catch (e) {
      await execCmd(`git remote add origin ${repoUrl}`)
    }

    // 3. Obtener rama actual automáticamente
    await actualizarMensaje(`🔄 *Actualizando bot*\n\n📦 Repositorio: Fer280809/Aurex\n🔍 Detectando rama actual...`)
    
    let ramaActual
    try {
      const { stdout } = await execCmd('git branch --show-current')
      ramaActual = stdout.trim()
      
      if (!ramaActual) {
        // Si no hay rama, usar main por defecto
        ramaActual = 'main'
        await execCmd('git checkout -b main')
      }
    } catch (e) {
      await m.react('❌')
      await actualizarMensaje('❌ *Error*\n\nNo se pudo detectar la rama actual del repositorio.')
      return
    }

    // 4. Verificar conexión con GitHub
    await actualizarMensaje(`🔄 *Actualizando bot*\n\n📦 Repositorio: Fer280809/Aurex\n🌿 Rama: ${ramaActual}\n📡 Conectando con GitHub...`)
    
    try {
      await execCmd('git fetch origin --prune')
    } catch (e) {
      await m.react('❌')
      await actualizarMensaje('❌ *Error de conexión*\n\nNo se pudo conectar con GitHub. Verifica tu internet.')
      return
    }

    // 5. Crear backup de archivos importantes
    await actualizarMensaje(`🔄 *Actualizando bot*\n\n📦 Repositorio: Fer280809/Aurex\n🌿 Rama: ${ramaActual}\n💾 Creando respaldo de seguridad...`)

    await execCmd(`mkdir -p "${backupDir}"`)

    const backupFiles = ['database.json', 'settings.js', 'sessions']
    for (const file of backupFiles) {
      try {
        await execCmd(`cp -r "${botDir}/${file}" "${backupDir}/${file}" 2>/dev/null || true`)
      } catch (e) {
        console.log(`No se pudo respaldar ${file}:`, e.message)
      }
    }

    // 6. Verificar si hay actualizaciones disponibles
    await actualizarMensaje(`🔄 *Actualizando bot*\n\n📦 Repositorio: Fer280809/Aurex\n🌿 Rama: ${ramaActual}\n📊 Verificando cambios disponibles...`)

    const { stdout: cambios } = await execCmd(`git log HEAD..origin/${ramaActual} --oneline --no-merges`)
    const listaCambios = cambios.split('\n').filter(l => l).slice(0, 5)

    if (listaCambios.length === 0) {
      await m.react('✅')
      await actualizarMensaje(`✅ *Bot actualizado*\n\n📦 Repositorio: Fer280809/Aurex\n🌿 Rama: \`${ramaActual}\`\n\n✨ No hay nuevas actualizaciones disponibles.\n\nYa tienes la versión más reciente.`)
      // Limpiar backup
      await execCmd(`rm -rf "${backupDir}"`)
      return
    }

    // 7. Aplicar actualización
    await actualizarMensaje(`🔄 *Actualizando bot*\n\n📦 Repositorio: Fer280809/Aurex\n🌿 Rama: ${ramaActual}\n⚡ Aplicando ${listaCambios.length} actualización(es)...`)

    try {
      // Guardar cambios locales temporalmente
      await execCmd('git stash')

      // Hacer pull de la rama actual desde el repositorio
      const { stdout: pullResult } = await execCmd(`git pull origin ${ramaActual} --no-rebase`)

      if (pullResult.includes('CONFLICT') || pullResult.includes('error:')) {
        await execCmd('git merge --abort')
        await execCmd('git stash pop')
        throw new Error('Conflicto al fusionar cambios')
      }

      // 8. Verificar si package.json cambió
      const packageChanged = pullResult.toLowerCase().includes('package.json')

      if (packageChanged) {
        await actualizarMensaje(`🔄 *Actualizando bot*\n\n📦 Repositorio: Fer280809/Aurex\n🌿 Rama: ${ramaActual}\n📦 Instalando nuevas dependencias...`)
        try {
          await execCmd('npm install --legacy-peer-deps')
        } catch (npmError) {
          await execCmd('npm install --force')
        }
      }

      // 9. Restaurar archivos importantes del backup
      const checkBackup = async (file) => {
        try {
          const { stdout } = await execCmd(`[ -e "${backupDir}/${file}" ] && echo "exists"`)
          return stdout.includes('exists')
        } catch {
          return false
        }
      }

      if (await checkBackup('database.json')) {
        await execCmd(`cp "${backupDir}/database.json" "${botDir}/database.json"`)
      }

      if (await checkBackup('settings.js')) {
        await execCmd(`cp "${backupDir}/settings.js" "${botDir}/settings.js"`)
      }

      if (await checkBackup('sessions')) {
        await execCmd(`rm -rf "${botDir}/sessions" 2>/dev/null || true`)
        await execCmd(`cp -r "${backupDir}/sessions" "${botDir}/"`)
      }

      // Restaurar cambios locales si los había
      try {
        await execCmd('git stash pop')
      } catch (e) {
        // No había cambios locales guardados
      }

      // 10. Obtener información del último commit
      const { stdout: commitHash } = await execCmd('git log -1 --pretty=format:"%h"')
      const { stdout: commitMsg } = await execCmd('git log -1 --pretty=format:"%s"')
      const { stdout: commitAuthor } = await execCmd('git log -1 --pretty=format:"%an"')
      const { stdout: commitDate } = await execCmd('git log -1 --pretty=format:"%cr"')
      const filesChanged = (pullResult.match(/\| \d+ [+-]+/g) || []).length

      // 11. Mensaje final de éxito
      const mensajeFinal = `
✅ *ACTUALIZACIÓN COMPLETADA*

📦 *Repositorio:* Fer280809/Aurex
🌿 *Rama:* \`${ramaActual}\`

📊 *Estadísticas:*
   • ${listaCambios.length} commit(s) aplicados
   • ${filesChanged} archivo(s) modificado(s)
   • ${packageChanged ? '✅' : '➖'} Dependencias actualizadas

🆕 *Último cambio:*
   📝 ${commitMsg.trim()}
   👤 Por ${commitAuthor.trim()}
   🕐 ${commitDate.trim()}

${listaCambios.length > 0 ? `📌 *Cambios aplicados:*\n${listaCambios.map(c => `   • ${c.substring(8)}`).join('\n')}\n` : ''}
⚠️ *Para aplicar los cambios:*
Reinicia el bot con *${usedPrefix}reiniciar*

💾 Backup guardado temporalmente
      `.trim()

      await m.react('✅')
      await actualizarMensaje(mensajeFinal)

      // Limpiar backup después de 1 minuto
      setTimeout(async () => {
        try {
          await execCmd(`rm -rf "${backupDir}"`)
        } catch (e) {
          console.log('No se pudo eliminar backup:', e.message)
        }
      }, 60000)

    } catch (updateError) {
      await actualizarMensaje(`🔄 *Actualizando bot*\n\n⚠️ Error durante actualización, restaurando versión anterior...`)

      try {
        const restoreFile = async (file) => {
          try {
            const { stdout } = await execCmd(`[ -e "${backupDir}/${file}" ] && echo "exists"`)
            const exists = stdout.includes('exists')
            
            if (exists) {
              if (file === 'sessions') {
                await execCmd(`rm -rf "${botDir}/sessions" 2>/dev/null || true`)
                await execCmd(`cp -r "${backupDir}/sessions" "${botDir}/"`)
              } else {
                await execCmd(`cp "${backupDir}/${file}" "${botDir}/${file}"`)
              }
            }
          } catch (e) {}
        }

        await restoreFile('database.json')
        await restoreFile('settings.js')
        await restoreFile('sessions')
        
        await execCmd('git reset --hard HEAD')

        await m.react('❌')
        await actualizarMensaje(
          `❌ *Actualización fallida*\n\n📦 Repositorio: Fer280809/Aurex\n🔄 Se restauró la versión anterior\n🌿 Rama: \`${ramaActual}\`\n\n⚠️ Error: ${updateError.message}\n\n📍 Usa *${usedPrefix}report* para informar el problema.`
        )
      } catch (restoreError) {
        await m.react('💀')
        await actualizarMensaje(
          `💀 *Error crítico*\n\nNo se pudo restaurar el backup.\n\nContacta al desarrollador.\n\n📂 Backup en: ${backupDir}`
        )
      }
    }

  } catch (error) {
    await m.react('✖️')
    await conn.sendMessage(m.chat, { 
      text: `⚠️ *Error inesperado*\n\n${error.message}\n\n📍 Usa *${usedPrefix}report* para informar.` 
    }, { quoted: m })
  }
}

handler.help = ['update', 'actualizar', 'upgrade']
handler.tags = ['owner']
handler.command = ['update', 'actualizar', 'upgrade']
handler.owner = true

export default handler
.update
