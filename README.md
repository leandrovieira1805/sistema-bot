# Sistema Bot WhatsApp com Autenticação

Sistema completo de bot WhatsApp com dashboard administrativo e sistema de autenticação multi-usuário.

## 🚀 Funcionalidades

### Sistema de Autenticação
- ✅ Login com usuário e senha
- ✅ Cada usuário tem suas próprias configurações do bot
- ✅ Proteção de rotas
- ✅ Logout seguro
- ✅ Interface moderna e responsiva

### Bot WhatsApp
- ✅ Envio de foto do cardápio quando solicitado
- ✅ Reconhecimento de pedidos por nome do item
- ✅ Busca automática de valores nas configurações
- ✅ Processamento de pedidos completo
- ✅ Suporte a PIX e dinheiro

### Dashboard Administrativo
- ✅ Gestão de categorias e produtos
- ✅ Configurações personalizadas por usuário
- ✅ Painel de pedidos em tempo real
- ✅ Simulador do bot WhatsApp
- ✅ Gestão de promoções

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

## 👤 Usuários Padrão

O sistema vem com um usuário administrador pré-configurado:

- **Usuário:** `admin`
- **Senha:** `admin123`

## 📱 Como Usar

### 1. Acesso ao Dashboard
- Acesse `http://localhost:3000`
- Faça login com as credenciais acima
- Configure suas configurações personalizadas

### 2. Configuração do Bot
- Vá em "Configurações da Loja"
- Adicione a URL da imagem do seu cardápio
- Configure nome da loja, mensagens, PIX, etc.

### 3. Gestão de Produtos
- Crie categorias (ex: Pizzas, Bebidas)
- Adicione produtos com nome, preço e imagem
- Os produtos serão reconhecidos automaticamente pelo bot

### 4. Conectar WhatsApp
- Clique no botão "WhatsApp" no header
- Escaneie o QR Code com seu WhatsApp
- O bot estará pronto para receber pedidos

### 5. Teste o Bot
- Envie "oi" para o número conectado
- Digite "1" ou "cardápio" para ver a foto
- Digite o nome de um produto para fazer pedido

## 🔐 Sistema de Autenticação

### Estrutura de Usuários
Cada usuário possui:
- Configurações únicas da loja
- Produtos e categorias próprios
- Histórico de pedidos independente

### Adicionar Novos Usuários
1. Acesse o painel administrativo
2. Vá em "Gerenciar Usuários" (se implementado)
3. Crie novos usuários com suas configurações

## 🛠️ Tecnologias

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + Socket.IO
- **WhatsApp:** whatsapp-web.js
- **Autenticação:** Sistema customizado
- **Deploy:** Railway (configurado)

## 📦 Deploy no Railway

O projeto está configurado para deploy automático no Railway:

1. Conecte seu repositório GitHub ao Railway
2. O deploy acontece automaticamente
3. Acesse a URL fornecida pelo Railway

## 🔧 Configurações Avançadas

### Variáveis de Ambiente
```bash
PORT=3002                    # Porta do servidor
PUPPETEER_EXECUTABLE_PATH    # Caminho do Chrome (Railway)
```

### Estrutura de Arquivos
```
src/
├── components/
│   ├── Auth/               # Componentes de autenticação
│   ├── Dashboard/          # Painéis administrativos
│   ├── Layout/             # Layout da aplicação
│   └── Modals/             # Modais do sistema
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticação
├── hooks/
│   └── useStore.ts         # Hook para gerenciar estado
├── services/
│   └── whatsappService.ts  # Serviço do WhatsApp
└── types/
    └── index.ts            # Tipos TypeScript
```

## 🐛 Solução de Problemas

### Bot não conecta
- Verifique se o QR Code foi escaneado
- Reinicie o servidor se necessário
- Verifique os logs no console

### Login não funciona
- Use as credenciais padrão: `admin` / `admin123`
- Verifique se o servidor está rodando
- Limpe o cache do navegador

### Deploy no Railway
- Verifique os logs do Railway
- Adicione variáveis de ambiente se necessário
- Certifique-se de que o `package.json` está correto

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Consulte a documentação
3. Abra uma issue no GitHub

## 📄 Licença

Este projeto é de uso livre para fins educacionais e comerciais.

---

**Desenvolvido com ❤️ para facilitar a gestão de bots WhatsApp** 