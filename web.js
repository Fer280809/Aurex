import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import cors from 'cors'
import bodyParser from 'body-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// API para verificar usuario premium
app.post('/api/verify-premium', (req, res) => {
  const { phone } = req.body
  const phoneDigits = phone.replace(/\D/g, '')
  
  const isPremium = global.premiumUsers.includes(phoneDigits) ||
                   global.owner.map(v => v.replace(/\D/g, '')).includes(phoneDigits)
  
  res.json({
    success: isPremium,
    isPremium: isPremium,
    phone: phoneDigits,
    features: isPremium ? global.premiumFeatures : null,
    maxBots: isPremium ? global.premiumFeatures.maxSubBots : 0
  })
})

// API para crear bot premium
app.post('/api/create-bot', async (req, res) => {
  try {
    const { ownerPhone, botPhone, label } = req.body
    
    if (!ownerPhone || !botPhone) {
      return res.status(400).json({ error: 'Faltan datos requeridos' })
    }
    
    // Verificar premium
    const ownerDigits = ownerPhone.replace(/\D/g, '')
    if (!global.premiumUsers.includes(ownerDigits) &&
        !global.owner.map(v => v.replace(/\D/g, '')).includes(ownerDigits)) {
      return res.status(403).json({ error: 'Usuario no premium' })
    }
    
    // Crear bot
    const botConfig = await createPremiumBot(ownerPhone, botPhone, label)
    
    // Iniciar bot (generar QR)
    const sock = await startPremiumBot(botPhone)
    
    res.json({
      success: true,
      message: 'Bot creado exitosamente',
      bot: botConfig,
      qrAvailable: true
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// API para editar bot
app.post('/api/edit-bot', (req, res) => {
  try {
    const { botPhone, config } = req.body
    
    if (!botPhone || !config) {
      return res.status(400).json({ error: 'Faltan datos' })
    }
    
    const updatedBot = editPremiumBotConfig(botPhone, config)
    
    res.json({
      success: true,
      message: 'Configuración actualizada',
      bot: updatedBot
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// API para obtener bots de usuario
app.post('/api/user-bots', (req, res) => {
  const { ownerPhone } = req.body
  
  if (!ownerPhone) {
    return res.status(400).json({ error: 'Número requerido' })
  }
  
  const userBots = getUserPremiumBots(ownerPhone)
  
  res.json({
    success: true,
    bots: userBots,
    count: userBots.length,
    maxBots: global.premiumFeatures.maxSubBots
  })
})

// API para eliminar bot
app.post('/api/delete-bot', async (req, res) => {
  try {
    const { botPhone } = req.body
    
    if (!botPhone) {
      return res.status(400).json({ error: 'Número de bot requerido' })
    }
    
    await deletePremiumBot(botPhone)
    
    res.json({
      success: true,
      message: 'Bot eliminado exitosamente'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// API para obtener QR del bot
app.get('/api/bot-qr/:botPhone', (req, res) => {
  const botDigits = req.params.botPhone.replace(/\D/g, '')
  const botConfig = global.premiumBots[botDigits]
  
  if (!botConfig) {
    return res.status(404).json({ error: 'Bot no encontrado' })
  }
  
  const qrPath = path.join(botConfig.sessionPath, 'qr.png')
  
  if (fs.existsSync(qrPath)) {
    res.sendFile(qrPath)
  } else {
    res.status(404).json({ error: 'QR no disponible' })
  }
})

// API para estado del bot
app.get('/api/bot-status/:botPhone', (req, res) => {
  const botDigits = req.params.botPhone.replace(/\D/g, '')
  const botConfig = global.premiumBots[botDigits]
  
  if (!botConfig) {
    return res.status(404).json({ error: 'Bot no encontrado' })
  }
  
  // Verificar si está conectado
  const isConnected = global.premiumConns.some(conn => 
    conn.botConfig?.phone === botDigits && conn.user?.id
  )
  
  res.json({
    success: true,
    bot: botConfig,
    isConnected: isConnected,
    status: isConnected ? 'online' : botConfig.status
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Panel Premium corriendo en: http://localhost:${PORT}`)
  console.log(`📱 Usuarios premium: ${global.premiumUsers.length}`)
  console.log(`🤖 Bots premium activos: ${Object.keys(global.premiumBots).length}`)
})

// Importar funciones del sistema premium
import { 
  createPremiumBot, 
  startPremiumBot, 
  editPremiumBotConfig, 
  getUserPremiumBots, 
  deletePremiumBot 
} from './sockets-premium.js'
