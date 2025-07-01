# Bot WhatsApp - Sistema de Pedidos

Este é um sistema completo de bot para WhatsApp que permite receber pedidos automaticamente e gerenciá-los através de um painel administrativo.

## 🚀 Funcionalidades

- ✅ Conexão real com WhatsApp Web
- ✅ Recebimento automático de mensagens
- ✅ Painel administrativo para gerenciar pedidos
- ✅ Interface moderna e responsiva
- ✅ Sistema de categorias de produtos
- ✅ Gerenciamento de promoções
- ✅ Configurações da loja

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- Google Chrome instalado (para o WhatsApp Web)
- Número de WhatsApp ativo

## 🛠️ Instalação

1. **Clone o repositório:**
```bash
git clone <url-do-repositorio>
cd project
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente (opcional):**
Crie um arquivo `.env` na raiz do projeto:
```env
PORT=3001
CHROME_PATH=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe
```

## 🚀 Como Executar

### Opção 1: Desenvolvimento (Recomendado)
Para rodar tanto o servidor backend quanto o frontend simultaneamente:
```bash
npm run dev:full
```

### Opção 2: Separadamente
1. **Servidor backend:**
```bash
npm run server
```

2. **Frontend (em outro terminal):**
```bash
npm run dev
```

### Opção 3: Produção
```bash
npm run start
```

## 📱 Como Conectar o WhatsApp

1. **Acesse o painel:**
   - Abra o navegador e vá para `http://localhost:3000`
   - Ou se estiver usando produção: `http://localhost:3001`

2. **Conecte o WhatsApp:**
   - No painel, vá para a seção "Conexão WhatsApp"
   - Clique em "Conectar WhatsApp"
   - Aguarde o QR Code aparecer
   - Abra o WhatsApp no seu celular
   - Vá em Configurações > Aparelhos conectados > Conectar um aparelho
   - Escaneie o QR Code

3. **Pronto!**
   - Seu bot estará conectado e pronto para receber pedidos
   - As mensagens recebidas aparecerão automaticamente no painel

## 🎯 Como Usar

### Recebendo Pedidos
- O bot responderá automaticamente às mensagens recebidas
- Os pedidos aparecerão no painel "Pedidos"
- Você pode gerenciar os status dos pedidos

### Gerenciando Produtos
- Vá para "Gerenciar Produtos" no painel
- Adicione, edite ou remova produtos
- Organize por categorias

### Configurações
- Personalize as informações da sua loja
- Configure horários de funcionamento
- Defina mensagens automáticas

## 🔧 Estrutura do Projeto

```
project/
├── src/
│   ├── components/
│   │   ├── Bot/           # Componentes do bot
│   │   ├── Dashboard/     # Painel administrativo
│   │   ├── Layout/        # Layout da aplicação
│   │   ├── Modals/        # Modais
│   │   └── WhatsApp/      # Componentes do WhatsApp
│   ├── services/
│   │   └── whatsappService.ts  # Serviço do WhatsApp
│   ├── hooks/
│   │   └── useStore.ts    # Hook para gerenciamento de estado
│   └── types/
│       └── index.ts       # Tipos TypeScript
├── server.js              # Servidor backend
├── package.json
└── README.md
```

## 🛡️ Segurança

- O WhatsApp Web usa autenticação local
- Os dados de sessão ficam armazenados localmente
- Não compartilhe os arquivos de autenticação

## 🔍 Troubleshooting

### Problemas Comuns

1. **Erro ao conectar WhatsApp:**
   - Verifique se o Chrome está instalado
   - Certifique-se de que o servidor está rodando
   - Tente desconectar e reconectar

2. **QR Code não aparece:**
   - Aguarde alguns segundos
   - Verifique se o servidor está funcionando
   - Recarregue a página

3. **Bot não responde:**
   - Verifique se o WhatsApp está conectado
   - Confirme se o servidor está rodando
   - Verifique os logs do console

### Logs
Para ver os logs do servidor, observe o terminal onde está rodando o `server.js`.

## 📞 Suporte

Se encontrar problemas:
1. Verifique se todas as dependências estão instaladas
2. Confirme se o Chrome está instalado
3. Verifique os logs do servidor
4. Tente reiniciar o servidor

## 🔄 Atualizações

Para atualizar o projeto:
```bash
git pull origin main
npm install
npm run dev:full
```

## 📄 Licença

Este projeto é de uso livre para fins comerciais e pessoais.

---

**Desenvolvido com ❤️ para facilitar o gerenciamento de pedidos via WhatsApp** 