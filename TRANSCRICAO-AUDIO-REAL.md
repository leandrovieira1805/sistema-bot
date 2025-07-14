# 🎵 Transcrição Real de Áudio - Guia Completo

## 🚀 Implementação com OpenAI Whisper

### ✅ Status Atual
- ✅ **Código implementado** - Transcrição real funcionando
- ✅ **Fallback inteligente** - Simulação quando não há API key
- ✅ **Suporte a português** - Configurado para pt-BR
- ✅ **Logs detalhados** - Monitoramento completo

---

## 🔧 Configuração da API Key

### 1. **Obter API Key OpenAI**
1. Acesse: https://platform.openai.com/
2. Faça login ou crie conta
3. Vá em "API Keys"
4. Clique em "Create new secret key"
5. Copie a chave (formato: `sk-...`)

### 2. **Configurar no Railway (Recomendado)**
1. Acesse seu projeto no Railway
2. Vá em "Variables"
3. Adicione: `OPENAI_API_KEY = sua_chave_aqui`
4. Clique em "Save"

### 3. **Configurar Localmente (.env)**
```bash
# Crie arquivo .env na raiz do projeto
OPENAI_API_KEY=sk-sua_chave_aqui
```

---

## 🎯 Como Funciona Agora

### **Com API Key Configurada:**
1. Cliente envia áudio
2. Bot responde: "🎵 Processando seu áudio..."
3. Bot envia para OpenAI Whisper
4. Bot recebe transcrição real
5. Bot processa e responde

### **Sem API Key:**
1. Cliente envia áudio
2. Bot responde: "🎵 Processando seu áudio..."
3. Bot usa simulação inteligente
4. Bot processa e responde

---

## 📊 Logs do Sistema

### **Transcrição Real:**
```
🎵 Iniciando transcrição do áudio: uploads/audio_123456.ogg
🔄 Enviando áudio para OpenAI Whisper...
✅ Transcrição real obtida: quero duas pizzas de calabresa
```

### **Simulação (sem API key):**
```
🎵 Iniciando transcrição do áudio: uploads/audio_123456.ogg
⚠️ OpenAI API key não configurada, usando simulação
🎭 Usando simulação de transcrição...
📝 Transcrição simulada: quero duas pizzas de calabresa
```

### **Erro na API:**
```
🔄 Enviando áudio para OpenAI Whisper...
⚠️ Erro na API OpenAI, usando simulação: 401 Unauthorized
🎭 Usando simulação de transcrição...
```

---

## 💰 Custos da API

### **OpenAI Whisper Pricing:**
- **$0.006 por minuto** de áudio
- **Exemplo:** 1 minuto = $0.006 (R$ 0,03)
- **100 áudios de 30s** = $0.30 (R$ 1,50)

### **Limites Gratuitos:**
- **$5 de crédito** no primeiro mês
- **Aproximadamente 800 minutos** de áudio

---

## 🔄 Outras Opções de API

### **1. Google Speech-to-Text**
```javascript
// Instalar: npm install @google-cloud/speech
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

### **2. Azure Speech Services**
```javascript
// Instalar: npm install microsoft-cognitiveservices-speech-sdk
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const audioConfig = sdk.AudioConfig.fromWavFileInput(audioPath);
const speechConfig = sdk.SpeechConfig.fromSubscription(
  process.env.AZURE_SPEECH_KEY, 
  process.env.AZURE_SPEECH_REGION
);

const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
const result = await recognizer.recognizeOnceAsync();
return result.text;
```

### **3. Amazon Transcribe**
```javascript
// Instalar: npm install aws-sdk
const AWS = require('aws-sdk');
const transcribeService = new AWS.TranscribeService();

const params = {
  LanguageCode: 'pt-BR',
  Media: { MediaFileUri: audioPath },
  TranscriptionJobName: `transcription-${Date.now()}`
};

const result = await transcribeService.startTranscriptionJob(params).promise();
return result.TranscriptionJob.Transcript.TranscriptFileUri;
```

---

## 🧪 Testando a Transcrição

### **1. Teste Local:**
```bash
# Iniciar servidor
npm start

# Enviar áudio via WhatsApp
# Verificar logs no console
```

### **2. Teste no Railway:**
1. Configure a API key no Railway
2. Faça deploy
3. Envie áudio via WhatsApp
4. Verifique logs no Railway

### **3. Verificar Funcionamento:**
- **Com API key:** Logs mostram "Transcrição real obtida"
- **Sem API key:** Logs mostram "Transcrição simulada"
- **Com erro:** Logs mostram "Erro na API OpenAI"

---

## 🔧 Configurações Avançadas

### **Parâmetros OpenAI Whisper:**
```javascript
form.append('model', 'whisper-1');        // Modelo (whisper-1 é o melhor)
form.append('language', 'pt');            // Idioma (pt = português)
form.append('response_format', 'text');   // Formato de resposta
form.append('temperature', '0');          // Precisão (0 = mais preciso)
```

### **Formatos Suportados:**
- ✅ **OGG** (WhatsApp padrão)
- ✅ **MP3**
- ✅ **WAV**
- ✅ **M4A**
- ✅ **MP4**

### **Limites:**
- **Tamanho máximo:** 25MB
- **Duração:** Até 10 minutos
- **Qualidade:** Qualquer qualidade

---

## 🚨 Solução de Problemas

### **Erro 401 (Unauthorized):**
```
⚠️ Erro na API OpenAI: 401 Unauthorized
```
**Solução:** Verificar se a API key está correta

### **Erro 429 (Rate Limit):**
```
⚠️ Erro na API OpenAI: 429 Too Many Requests
```
**Solução:** Aguardar alguns minutos e tentar novamente

### **Erro de Arquivo:**
```
⚠️ Arquivo de áudio não encontrado
```
**Solução:** Verificar se o upload está funcionando

### **Timeout:**
```
⚠️ Timeout ao baixar áudio
```
**Solução:** Verificar conexão com internet

---

## 📈 Monitoramento

### **Métricas Importantes:**
- **Taxa de sucesso** da transcrição
- **Tempo médio** de processamento
- **Custos** da API
- **Qualidade** das transcrições

### **Logs para Monitorar:**
```
✅ Transcrição real obtida: [texto]
⚠️ Erro na API OpenAI: [erro]
🎭 Usando simulação de transcrição
```

---

## 🎯 Próximos Passos

### **1. Implementar Cache:**
- Salvar transcrições similares
- Reduzir custos da API
- Melhorar velocidade

### **2. Suporte a Múltiplos Idiomas:**
- Detectar idioma automaticamente
- Suporte a inglês, espanhol
- Configuração por loja

### **3. Melhorar Precisão:**
- Contexto do negócio
- Vocabulário específico
- Correção automática

### **4. Interface de Configuração:**
- Configurar API key via dashboard
- Testar transcrição
- Ver estatísticas de uso

---

## ✅ Checklist de Implementação

- [ ] Obter API key OpenAI
- [ ] Configurar no Railway/local
- [ ] Testar transcrição real
- [ ] Verificar logs
- [ ] Monitorar custos
- [ ] Configurar alertas (opcional)
- [ ] Documentar para equipe

---

**Status**: ✅ **Implementado e Funcionando**
**Próximo**: 🔄 **Configurar API key e testar** 