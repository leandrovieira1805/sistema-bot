const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuração do cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Variáveis globais
let qrCodeData = null;
let isConnected = false;
let clientInfo = null;

// Eventos do WhatsApp
client.on('qr', (qr) => {
    console.log('QR Code recebido:', qr);
    qrCodeData = qr;
    isConnected = false;
    
    // Gerar QR Code no terminal
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Cliente WhatsApp conectado!');
    isConnected = true;
    qrCodeData = null;
    clientInfo = {
        name: client.info.pushname,
        number: client.info.wid.user
    };
});

client.on('authenticated', () => {
    console.log('WhatsApp autenticado!');
});

client.on('auth_failure', (msg) => {
    console.log('Falha na autenticação:', msg);
    isConnected = false;
    qrCodeData = null;
});

client.on('disconnected', (reason) => {
    console.log('Cliente desconectado:', reason);
    isConnected = false;
    qrCodeData = null;
    clientInfo = null;
});

// Rota para obter status da conexão
app.get('/api/whatsapp/status', (req, res) => {
    res.json({
        isConnected,
        qrCode: qrCodeData,
        clientInfo
    });
});

// Rota para gerar novo QR Code
app.get('/api/whatsapp/qr', (req, res) => {
    if (isConnected) {
        res.json({ 
            isConnected: true, 
            message: 'Já conectado ao WhatsApp' 
        });
    } else if (qrCodeData) {
        res.json({ 
            isConnected: false, 
            qrCode: qrCodeData 
        });
    } else {
        res.json({ 
            isConnected: false, 
            message: 'Aguardando QR Code...' 
        });
    }
});

// Rota para desconectar
app.post('/api/whatsapp/disconnect', (req, res) => {
    if (isConnected) {
        client.destroy();
        res.json({ message: 'Desconectado com sucesso' });
    } else {
        res.json({ message: 'Não estava conectado' });
    }
});

// Rota para enviar mensagem
app.post('/api/whatsapp/send', async (req, res) => {
    if (!isConnected) {
        return res.status(400).json({ error: 'WhatsApp não está conectado' });
    }

    const { number, message, image } = req.body;

    try {
        // Formatar número
        const formattedNumber = number.replace(/\D/g, '');
        const chatId = `${formattedNumber}@c.us`;

        if (image) {
            // Enviar mensagem com imagem
            const media = MessageMedia.fromUrl(image);
            await client.sendMessage(chatId, media, { caption: message });
        } else {
            // Enviar apenas texto
            await client.sendMessage(chatId, message);
        }

        res.json({ success: true, message: 'Mensagem enviada com sucesso' });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
});

// Rota para receber mensagens (webhook)
app.post('/api/whatsapp/webhook', (req, res) => {
    const { message } = req.body;
    
    if (message) {
        console.log('Mensagem recebida:', message);
        // Aqui você pode processar a mensagem com a IA
    }
    
    res.json({ success: true });
});

// Rota principal
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>WhatsApp Bot - QR Code</title>
            <meta charset="utf-8">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    max-width: 600px; 
                    margin: 50px auto; 
                    padding: 20px;
                    text-align: center;
                }
                .status { 
                    padding: 15px; 
                    margin: 20px 0; 
                    border-radius: 8px; 
                }
                .connected { background: #d4edda; color: #155724; }
                .disconnected { background: #f8d7da; color: #721c24; }
                .qr-container { 
                    margin: 20px 0; 
                    padding: 20px; 
                    border: 2px dashed #ccc; 
                    border-radius: 8px;
                }
                button { 
                    padding: 10px 20px; 
                    margin: 10px; 
                    border: none; 
                    border-radius: 5px; 
                    cursor: pointer; 
                }
                .btn-primary { background: #007bff; color: white; }
                .btn-danger { background: #dc3545; color: white; }
                .btn-success { background: #28a745; color: white; }
            </style>
        </head>
        <body>
            <h1>🤖 WhatsApp Bot - QR Code</h1>
            
            <div id="status" class="status disconnected">
                <h3>Status: Desconectado</h3>
                <p>Aguardando conexão...</p>
            </div>
            
            <div id="qr-container" class="qr-container" style="display: none;">
                <h3>📱 Escaneie o QR Code</h3>
                <p>Abra o WhatsApp no seu celular e escaneie o código abaixo:</p>
                <div id="qrcode"></div>
            </div>
            
            <div id="client-info" style="display: none;">
                <h3>✅ Conectado!</h3>
                <p id="client-details"></p>
            </div>
            
            <div>
                <button class="btn-primary" onclick="checkStatus()">🔄 Verificar Status</button>
                <button class="btn-danger" onclick="disconnect()">❌ Desconectar</button>
                <button class="btn-success" onclick="generateQR()">📱 Gerar QR Code</button>
            </div>
            
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
            <script>
                let checkInterval;
                
                async function checkStatus() {
                    try {
                        const response = await fetch('/api/whatsapp/status');
                        const data = await response.json();
                        
                        const statusDiv = document.getElementById('status');
                        const qrContainer = document.getElementById('qr-container');
                        const clientInfo = document.getElementById('client-info');
                        const clientDetails = document.getElementById('client-details');
                        
                        if (data.isConnected) {
                            statusDiv.className = 'status connected';
                            statusDiv.innerHTML = '<h3>Status: Conectado</h3><p>WhatsApp está funcionando!</p>';
                            qrContainer.style.display = 'none';
                            clientInfo.style.display = 'block';
                            
                            if (data.clientInfo) {
                                clientDetails.innerHTML = \`
                                    <strong>Nome:</strong> \${data.clientInfo.name}<br>
                                    <strong>Número:</strong> \${data.clientInfo.number}
                                \`;
                            }
                        } else {
                            statusDiv.className = 'status disconnected';
                            statusDiv.innerHTML = '<h3>Status: Desconectado</h3><p>Aguardando QR Code...</p>';
                            clientInfo.style.display = 'none';
                            
                            if (data.qrCode) {
                                qrContainer.style.display = 'block';
                                QRCode.toCanvas(document.getElementById('qrcode'), data.qrCode, {
                                    width: 256,
                                    margin: 2
                                });
                            } else {
                                qrContainer.style.display = 'none';
                            }
                        }
                    } catch (error) {
                        console.error('Erro ao verificar status:', error);
                    }
                }
                
                async function disconnect() {
                    try {
                        await fetch('/api/whatsapp/disconnect', { method: 'POST' });
                        checkStatus();
                    } catch (error) {
                        console.error('Erro ao desconectar:', error);
                    }
                }
                
                async function generateQR() {
                    try {
                        const response = await fetch('/api/whatsapp/qr');
                        const data = await response.json();
                        checkStatus();
                    } catch (error) {
                        console.error('Erro ao gerar QR Code:', error);
                    }
                }
                
                // Verificar status a cada 2 segundos
                checkInterval = setInterval(checkStatus, 2000);
                
                // Verificar status inicial
                checkStatus();
            </script>
        </body>
        </html>
    `);
});

// Inicializar cliente WhatsApp
client.initialize();

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor WhatsApp rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
    console.log('⏳ Aguardando QR Code...');
});

// Tratamento de erros
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor...');
    client.destroy();
    process.exit(0);
}); 