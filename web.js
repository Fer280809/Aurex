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

// Crear carpeta public si no existe
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true })
}

// Página principal
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Asta Bot Premium Panel</title>
        <style>
          body { 
            background: linear-gradient(135deg, #1A1B26 0%, #12121C 100%);
            color: #E4E7EC; 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
          }
          h1 { color: #FF2E63; }
          .btn { 
            background: linear-gradient(45deg, #FF2E63, #7D5FFF);
            color: white; 
            padding: 15px 30px; 
            border-radius: 10px; 
            text-decoration: none; 
            display: inline-block; 
            margin: 10px; 
            font-weight: bold; 
          }
        </style>
      </head>
      <body>
        <h1>🚀 Panel Premium Asta Bot</h1>
        <p>Panel de control para bots premium</p>
        <p>Usa el comando <code>/panel</code> en WhatsApp para acceder</p>
      </body>
      </html>
    `)
  }
})

// API para verificar premium
app.post('/api/verify-premium', (req, res) => {
  const { phone } = req.body
  if (!phone) return res.json({ success: false, error: 'Número requerido' })
  
  const phoneDigits = phone.replace(/\D/g, '')
  const isPremium = global.premiumUsers.includes(phoneDigits) ||
                   global.owner?.map(v => v.replace(/\D/g, '')).includes(phoneDigits)
  
  res.json({
    success: isPremium,
    isPremium: isPremium,
    phone: phoneDigits,
    features: isPremium ? global.premiumFeatures : null,
    maxBots: isPremium ? global.premiumFeatures?.maxSubBots || 5 : 0
  })
})

// API para bots del usuario
app.post('/api/user-bots', (req, res) => {
  const { ownerPhone } = req.body
  if (!ownerPhone) return res.json({ success: false, error: 'Número requerido' })
  
  const ownerDigits = ownerPhone.replace(/\D/g, '')
  const userBots = Object.values(global.premiumBots || {}).filter(bot => 
    bot.owner === ownerDigits
  )
  
  res.json({
    success: true,
    bots: userBots,
    count: userBots.length,
    maxBots: global.premiumFeatures?.maxSubBots || 5
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Panel Premium corriendo en: http://localhost:${PORT}`)
  if (global.premiumUsers) {
    console.log(`👑 Usuarios premium: ${global.premiumUsers.length}`)
  }
  if (global.premiumBots) {
    console.log(`🤖 Bots premium: ${Object.keys(global.premiumBots).length}`)
  }
})
