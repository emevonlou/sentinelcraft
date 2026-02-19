# Minecraft Hypixel Security — Desktop App (Tauri)

Este app é uma UI local para rodar checks **allowlisted** do repositório (Linux e Windows), gerar um resumo visual e salvar relatórios localmente em `reports/`.

- Não intercepta pacotes.
- Não captura credenciais.
- Não “espiona” o Hypixel.
- Apenas observa o **estado local** (processos e conexões) e apresenta o resultado.

## PT-BR — Como rodar (modo dev)

### Pré-requisitos
- Node.js + npm
- Rust (via rustup) + cargo
- Dependências do sistema para WebView/GTK (Linux)

### Rodar
```bash
cd app
export PATH="$HOME/.cargo/bin:$PATH"
npm install
npx tauri dev
```
### Onde ficam os relatórios?

O app salva automaticamente em: ../reports/
Esses arquivos são ignorados pelo Git (não sobem para o GitHub). 

### EN — How to run (dev mode)
Requirements

Node.js + npm
Rust (rustup) + cargo
System dependencies for WebView/GTK (Linux)

### Run
```bash
cd app
export PATH="$HOME/.cargo/bin:$HOME/.cargo/bin:$PATH"
npm install
npx tauri dev
```

### Where are reports saved?

Auto-saved to: ../reports/
Reports are gitignored (never committed).

