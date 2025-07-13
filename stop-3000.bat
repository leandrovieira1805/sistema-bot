@echo off
echo Parando processos na porta 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Encerrando processo PID: %%a
    taskkill /PID %%a /F
)
echo Processos na porta 3000 encerrados!
pause 