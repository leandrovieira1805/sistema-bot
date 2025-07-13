# 🎵 Transcrição de Áudio - WhatsApp Bot

## Funcionalidade Implementada

O bot agora suporta **transcrição de áudio** quando clientes enviam mensagens de voz pelo WhatsApp!

### ✅ Como Funciona

1. **Cliente envia áudio** → Bot detecta automaticamente
2. **Bot baixa o áudio** → Salva temporariamente
3. **Bot transcreve** → Converte áudio em texto
4. **Bot processa** → Responde normalmente como se fosse texto

### 🎯 Tipos de Áudio Suportados

- ✅ **PTT (Push-to-Talk)** - Áudio gravado pressionando o botão
- ✅ **Audio** - Arquivos de áudio enviados

### 📝 Implementação Atual

**Versão de Teste (Simulada):**
- Simula transcrição com frases pré-definidas
- Resposta em 2 segundos
- Frases relacionadas ao negócio (pizzaria)

**Frases Simuladas:**
- "quero uma pizza de calabresa"
- "qual o preço da coca cola"
- "fazer um pedido"
- "quero ver o cardápio"
- "qual o endereço da loja"
- "aceitam cartão de crédito"
- "quero delivery"
- "qual o tempo de entrega"

### 🚀 Para Implementar Transcrição Real

#### Opção 1: OpenAI Whisper (Recomendado)
```javascript
// Descomente no server.js e adicione sua API key
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('file', fs.createReadStream(audioPath));
form.append('model', 'whisper-1');

const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    ...form.getHeaders()
  },
  body: form
});

const result = await response.json();
return result.text;
```

#### Opção 2: Google Speech-to-Text
```javascript
// Requer Google Cloud Speech-to-Text API
const speech = require('@google-cloud/speech');
const client = new speech.SpeechClient();

const audioBytes = fs.readFileSync(audioPath).toString('base64');
const audio = { content: audioBytes };
const config = {
  encoding: 'OGG_OPUS',
  sampleRateHertz: 48000,
  languageCode: 'pt-BR',
};

const request = { audio: audio, config: config };
const [response] = await client.recognize(request);
return response.results.map(result => result.alternatives[0].transcript).join('\n');
```

#### Opção 3: Azure Speech Services
```javascript
// Requer Azure Speech Services
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const audioConfig = sdk.AudioConfig.fromWavFileInput(audioPath);
const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY, process.env.AZURE_SPEECH_REGION);

const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
const result = await recognizer.recognizeOnceAsync();
return result.text;
```

### 🔧 Configuração

1. **Adicione a API key** no Railway ou arquivo `.env`:
   ```
   OPENAI_API_KEY=sua_chave_aqui
   ```

2. **Descomente o código** da API escolhida no `server.js`

3. **Remova a simulação** e use a API real

### 💡 Vantagens

- **Acessibilidade** → Clientes podem usar voz
- **Conveniência** → Mais rápido que digitar
- **Experiência** → Interface mais natural
- **Inclusão** → Ajuda pessoas com dificuldades motoras

### 🎯 Casos de Uso

- Cliente no trânsito
- Cliente com as mãos ocupadas
- Cliente com dificuldade de digitação
- Cliente preferindo voz

### 📊 Logs

O bot registra:
- `🎵 Mensagem de áudio detectada!`
- `✅ Áudio baixado com sucesso`
- `📝 Texto transcrito: [texto]`
- `❌ Erro ao processar áudio`

### 🔄 Fluxo Completo

1. Cliente envia áudio
2. Bot responde: "🎵 Processando seu áudio..."
3. Bot transcreve o áudio
4. Bot processa o texto transcrito
5. Bot responde normalmente
6. Arquivo temporário é deletado

### ⚠️ Limitações Atuais

- **Simulação**: Usa frases pré-definidas
- **Idioma**: Configurado para português
- **Formato**: Suporta OGG (WhatsApp padrão)
- **Tamanho**: Limitado pelo WhatsApp

### 🚀 Próximos Passos

1. Implementar API real de transcrição
2. Adicionar suporte a múltiplos idiomas
3. Melhorar precisão da transcrição
4. Adicionar cache de transcrições
5. Implementar fallback para texto

---

**Status**: ✅ Implementado (versão simulada)
**Próximo**: 🔄 Integrar API real de transcrição 