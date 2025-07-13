# Sistema Bot WhatsApp

Sistema completo de bot WhatsApp com dashboard administrativo, sem necessidade de autenticação.

## 🚀 Funcionalidades

### Bot WhatsApp
- ✅ Envio de foto do cardápio quando solicitado
- ✅ Reconhecimento de pedidos por nome do item usando IA
- ✅ Busca automática de valores nas configurações
- ✅ Processamento de pedidos completo
- ✅ Suporte a PIX e dinheiro
- ✅ Sistema de IA para entender pedidos com erros de digitação

### Dashboard Administrativo
- ✅ Gestão de categorias e produtos
- ✅ Configurações personalizadas da loja
- ✅ Painel de pedidos em tempo real
- ✅ Simulador do bot WhatsApp
- ✅ Gestão de promoções
- ✅ Interface moderna e responsiva

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- Google Chrome instalado (para o WhatsApp Web)
- Número de WhatsApp ativo

## 🛠️ Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/leandrovieira1805/sistema-bot.git
cd sistema-bot
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente (opcional):**
```bash
# Crie um arquivo .env na raiz do projeto
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
```

4. **Inicie o servidor:**
```bash
npm start
```

## 📱 Como Usar

### 1. Acesso ao Dashboard
- Acesse `http://localhost:3002`
- O sistema carrega automaticamente sem necessidade de login
- Configure suas configurações personalizadas

### 2. Configuração do Bot
- Vá em "Configurações da Loja"
- Adicione a URL da imagem do seu cardápio
- Configure nome da loja, mensagens, PIX, etc.

### 3. Gestão de Produtos
- Vá em "Gestão de Categorias" para criar categorias
- Clique em uma categoria para adicionar produtos
- Configure preços, imagens e descrições

### 4. Conectar WhatsApp
- Vá em "Simulador Bot WhatsApp"
- Clique em "Conectar WhatsApp"
- Escaneie o QR Code com seu WhatsApp
- O bot estará pronto para receber pedidos

### 5. Testar o Bot
- Use o simulador para testar as respostas do bot
- Envie mensagens como "1" para ver o cardápio
- Digite nomes de produtos para fazer pedidos

## 🤖 Como o Bot Funciona

### Comandos Principais
- **"1"** - Mostra o cardápio completo
- **"2"** - Mostra promoções ativas
- **"cardápio"** - Mostra o cardápio
- **"promoções"** - Mostra promoções
- **"carrinho"** - Mostra itens no carrinho
- **"finalizar pedido"** - Finaliza o pedido

### Sistema de IA
O bot usa inteligência artificial para:
- Reconhecer produtos mesmo com erros de digitação
- Sugerir produtos similares
- Entender variações de nomes
- Processar quantidades automaticamente

### Fluxo de Pedido
1. Cliente envia "1" para ver cardápio
2. Cliente digita nome do produto desejado
3. Bot confirma produto e quantidade
4. Cliente confirma adição ao carrinho
5. Cliente pode adicionar mais itens ou finalizar
6. Bot solicita dados de entrega e pagamento
7. Pedido é criado no dashboard

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express
- **WhatsApp:** whatsapp-web.js
- **IA:** Sistema próprio de matching de produtos
- **UI:** Tailwind CSS + Lucide React
- **Real-time:** Socket.IO

## 📁 Estrutura do Projeto

```
sistema-bot/
├── src/
│   ├── components/
│   │   ├── Bot/           # Componentes do bot
│   │   ├── Dashboard/     # Componentes do dashboard
│   │   ├── Layout/        # Header e Sidebar
│   │   ├── Modals/        # Modais do sistema
│   │   └── WhatsApp/      # Componentes do WhatsApp
│   ├── hooks/             # Hooks personalizados
│   ├── services/          # Serviços (WhatsApp, etc.)
│   └── types/             # Tipos TypeScript
├── server-simple.js       # Servidor principal
└── package.json
```

## 🔧 Configurações

### Configurações da Loja
- **Nome da Loja:** Nome que aparece nas mensagens
- **Mensagem de Boas-vindas:** Mensagem inicial do bot
- **Taxa de Entrega:** Valor fixo para entregas
- **Chave PIX:** Chave PIX para pagamentos
- **Endereço:** Endereço da loja
- **Imagem do Cardápio:** URL da imagem do cardápio

### Configurações do WhatsApp
- O bot salva a sessão automaticamente
- Reconecta automaticamente se desconectar
- Suporte a múltiplas sessões

## 🚀 Deploy

### Railway
O projeto está configurado para deploy no Railway:
```bash
npm start
```

### Vercel/Netlify
Para deploy do frontend:
```bash
npm run build
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se o Chrome está instalado
2. Confirme se o WhatsApp está conectado
3. Verifique os logs do servidor
4. Teste o QR Code em um ambiente bem iluminado

## 🔄 Atualizações

O sistema é atualizado automaticamente via Socket.IO. Todas as mudanças no dashboard são refletidas em tempo real no bot.

## 📄 Licença

Este projeto é de uso livre para fins comerciais e pessoais. 