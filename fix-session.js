import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para limpar sessão do WhatsApp
async function clearWhatsAppSession() {
  try {
    console.log('Iniciando limpeza da sessão do WhatsApp...');
    
    const sessionPath = path.join(__dirname, 'whatsapp_auth/session/Default');
    
    if (fs.existsSync(sessionPath)) {
      console.log('Diretório de sessão encontrado:', sessionPath);
      
      // Lista de arquivos que podem estar causando problemas
      const filesToRemove = [
        'chrome_debug.log',
        'chrome_debug.log.old',
        'chrome_debug.log.1',
        'chrome_debug.log.2'
      ];
      
      filesToRemove.forEach(file => {
        const filePath = path.join(sessionPath, file);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`✅ Arquivo ${file} removido com sucesso`);
          } catch (error) {
            console.log(`❌ Não foi possível remover ${file}:`, error.message);
          }
        } else {
          console.log(`ℹ️ Arquivo ${file} não encontrado`);
        }
      });
      
      // Tentar remover todo o diretório de sessão se estiver vazio
      try {
        const files = fs.readdirSync(sessionPath);
        if (files.length === 0) {
          fs.rmdirSync(sessionPath);
          console.log('✅ Diretório de sessão vazio removido');
        } else {
          console.log(`ℹ️ Diretório de sessão ainda contém ${files.length} arquivos`);
        }
      } catch (error) {
        console.log('ℹ️ Não foi possível remover diretório de sessão:', error.message);
      }
    } else {
      console.log('ℹ️ Diretório de sessão não encontrado');
    }
    
    console.log('Limpeza concluída!');
  } catch (error) {
    console.error('Erro durante a limpeza:', error);
  }
}

// Executar limpeza
clearWhatsAppSession(); 