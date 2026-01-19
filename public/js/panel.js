// Panel Premium JavaScript
const API_URL = window.location.origin;

class PremiumPanel {
    constructor() {
        this.userPhone = null;
        this.userBots = [];
        this.init();
    }
    
    async init() {
        this.showLogin();
        this.setupEventListeners();
    }
    
    showLogin() {
        const phone = prompt("Ingresa tu número premium (con código país):");
        if (!phone) return;
        
        this.verifyPremium(phone);
    }
    
    async verifyPremium(phone) {
        try {
            const response = await fetch(`${API_URL}/api/verify-premium`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.userPhone = data.phone;
                this.showUserInfo(data);
                this.loadUserBots();
            } else {
                alert('No eres usuario premium. Contacta al propietario.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    }
    
    showUserInfo(data) {
        document.getElementById('user-info').innerHTML = `
            <div class="premium-badge">
                <i class="fas fa-crown"></i>
                PREMIUM USER
            </div>
            <p>Número: +${data.phone}</p>
            <p>Bots disponibles: ${data.maxBots - this.userBots.length}</p>
        `;
    }
    
    async loadUserBots() {
        try {
            const response = await fetch(`${API_URL}/api/user-bots`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ownerPhone: this.userPhone })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.userBots = data.bots;
                this.renderBotsList();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
    
    renderBotsList() {
        const container = document.getElementById('bots-list');
        
        if (this.userBots.length === 0) {
            container.innerHTML = '<p>No tienes bots creados aún.</p>';
            return;
        }
        
        container.innerHTML = this.userBots.map(bot => `
            <div class="bot-card glass-card" data-bot="${bot.phone}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3>${bot.label}</h3>
                        <p>+${bot.phone}</p>
                        <p>Estado: <span class="${bot.status}">${bot.status}</span></p>
                    </div>
                    <div>
                        <button class="btn-edit" data-bot="${bot.phone}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-delete" data-bot="${bot.phone}">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Agregar eventos a los botones
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const botPhone = e.target.dataset.bot;
                this.showBotEditor(botPhone);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const botPhone = e.target.dataset.bot;
                this.deleteBot(botPhone);
            });
        });
    }
    
    setupEventListeners() {
        // Formulario de creación de bot
        document.getElementById('create-bot-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const botPhone = document.getElementById('bot-phone').value;
            const botLabel = document.getElementById('bot-label').value;
            
            if (!botPhone || !botLabel) {
                alert('Completa todos los campos');
                return;
            }
            
            await this.createBot(botPhone, botLabel);
        });
    }
    
    async createBot(botPhone, label) {
        try {
            const response = await fetch(`${API_URL}/api/create-bot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ownerPhone: this.userPhone,
                    botPhone: botPhone,
                    label: label
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Bot creado exitosamente. Escanea el QR para conectar.');
                this.loadUserBots();
                
                // Mostrar QR
                if (data.qrAvailable) {
                    this.showQR(botPhone);
                }
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error de conexión: ' + error.message);
        }
    }
    
    showQR(botPhone) {
        const qrUrl = `${API_URL}/api/bot-qr/${botPhone}`;
        window.open(qrUrl, '_blank');
    }
    
    showBotEditor(botPhone) {
        const bot = this.userBots.find(b => b.phone === botPhone);
        if (!bot) return;
        
        document.getElementById('edit-bot-form').innerHTML = `
            <input type="hidden" id="edit-bot-phone" value="${bot.phone}">
            
            <div class="form-group">
                <label>Nombre del Bot:</label>
                <input type="text" id="edit-bot-name" value="${bot.config.name}" required>
            </div>
            
            <div class="form-group">
                <label>Prefijo:</label>
                <input type="text" id="edit-bot-prefix" value="${bot.config.prefix}" required>
            </div>
            
            <div class="form-group">
                <label>Banner URL:</label>
                <input type="url" id="edit-bot-banner" value="${bot.config.banner}">
            </div>
            
            <div class="form-group">
                <label>Ícono URL:</label>
                <input type="url" id="edit-bot-icon" value="${bot.config.icon}">
            </div>
            
            <div class="form-group">
                <label>Estado (Bio):</label>
                <input type="text" id="edit-bot-status" value="${bot.config.status}">
            </div>
            
            <div class="form-group">
                <label>Canal:</label>
                <input type="url" id="edit-bot-channel" value="${bot.config.channel}">
            </div>
            
            <button type="submit" class="btn-premium">
                <i class="fas fa-save"></i> Guardar Cambios
            </button>
        `;
        
        document.getElementById('bot-editor').style.display = 'block';
        
        // Configurar submit del formulario de edición
        document.getElementById('edit-bot-form').onsubmit = async (e) => {
            e.preventDefault();
            await this.saveBotChanges(botPhone);
        };
    }
    
    async saveBotChanges(botPhone) {
        const config = {
            name: document.getElementById('edit-bot-name').value,
            prefix: document.getElementById('edit-bot-prefix').value,
            banner: document.getElementById('edit-bot-banner').value,
            icon: document.getElementById('edit-bot-icon').value,
            status: document.getElementById('edit-bot-status').value,
            channel: document.getElementById('edit-bot-channel').value
        };
        
        try {
            const response = await fetch(`${API_URL}/api/edit-bot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botPhone, config })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Configuración actualizada');
                this.loadUserBots();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
    
    async deleteBot(botPhone) {
        if (!confirm('¿Estás seguro de eliminar este bot? Se perderá la sesión.')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/api/delete-bot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botPhone })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Bot eliminado');
                this.loadUserBots();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

// Iniciar panel cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.premiumPanel = new PremiumPanel();
});
