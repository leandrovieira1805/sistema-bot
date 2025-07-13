# Migração para Porta 3002

## Alterações Realizadas

### 1. Configuração do Vite (`vite.config.ts`)
- Alterada a porta do servidor de desenvolvimento de 3000 para 3002
- Mantido o proxy para a API na porta 3002

### 2. Configuração do Servidor (`server.js`)
- Atualizadas as configurações CORS para aceitar conexões da porta 3002
- Removidas as referências à porta 3000

### 3. Arquivo de Configuração (`config.json`)
- Frontend agora usa porta 3002
- URLs atualizadas para usar localhost:3002
- CORS configurado para aceitar apenas a porta 3002

### 4. Scripts de Inicialização
- `start-all.bat` atualizado para parar processos na porta 3000
- Criado `stop-3000.bat` para encerrar processos antigos

### 5. Outros Servidores
- `server-orders.js`, `server-fixed.js`, `server-debug.js` atualizados
- Todas as referências à porta 3000 foram alteradas para 3002

## Como Usar

### Para Parar Processos Antigos:
```bash
# Execute o script para parar processos na porta 3000
stop-3000.bat
```

### Para Iniciar o Sistema:
```bash
# Use o script atualizado
start-all.bat
```

### Ou manualmente:
```bash
# Iniciar servidor e frontend juntos
npm run dev:full

# Ou separadamente
npm run server    # Backend na porta 3002
npm run dev       # Frontend na porta 3002
```

## Acesso ao Sistema

Agora o sistema está disponível apenas em:
- **http://localhost:3002** - Interface principal

## Benefícios

1. **Interface Única**: Não há mais confusão entre duas portas
2. **Configuração Simplificada**: Tudo roda na mesma porta
3. **Menos Conflitos**: Elimina problemas de CORS entre portas
4. **Manutenção Mais Fácil**: Uma única porta para gerenciar

## Notas Importantes

- Certifique-se de parar todos os processos antigos antes de iniciar
- O sistema agora usa apenas a porta 3002 para tudo
- Se houver problemas, verifique se não há processos rodando na porta 3000 