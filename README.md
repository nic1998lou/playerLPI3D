
# 3D LPI Studio - Android Build Guide

Este projeto está configurado para ser transformado em um aplicativo Android (.apk) automaticamente via GitHub Actions.

## 🚀 Como gerar o APK (Se a pasta .github não foi importada)

Se você importou o código e a pasta `.github` sumiu, siga estes passos diretamente no seu repositório do GitHub:

1. No seu repositório, clique em **Add file** -> **Create new file**.
2. No campo do nome do arquivo, digite exatamente: `.github/workflows/android-build.yml`
   * *(O GitHub criará as pastas automaticamente ao ver as barras `/`)*.
3. Cole o conteúdo do arquivo de workflow (fornecido no código do app) dentro deste novo arquivo.
4. Clique em **Commit changes**.

## 🛠️ Como baixar o seu APK
1. Vá na aba **Actions** no topo do seu repositório no GitHub.
2. Você verá um "workflow" chamado `Build Android APK`.
3. Clique na execução mais recente (pode levar uns 3-5 minutos para terminar).
4. Ao final, role até a seção **Artifacts** e baixe o arquivo `LPI-Studio-Debug-APK`.

## 📱 Instalação PWA (Sem compilar)
Se preferir não gerar um APK, abra o link do seu GitHub Pages no Chrome do Android e selecione **"Instalar Aplicativo"** no menu do navegador.
