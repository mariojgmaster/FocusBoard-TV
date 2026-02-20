# FocusBoard TV

Aplicativo de tarefas (TODO) focado em **Android TV**, desenvolvido com **React Native (react-native-tvos)** e **TypeScript**.

## Stack
- React Native TVOS (`react-native-tvos`)
- TypeScript
- Navegacao otimizada para D-Pad (controle remoto)

## Requisitos
- Node.js 20+
- Android SDK configurado
- Emulador/dispositivo Android TV

## Rodar localmente
No diretório do projeto:

```bash
npm install
npm start
```

Em outro terminal:

```bash
npm run android:tv
```

Scripts úteis:
- `npm run android`: run-android padrão
- `npm run android:tv`: executa no emulador TV configurado
- `npm run android:pick`: escolhe dispositivo Android disponível
- `npm run lint`: validação de lint

## Release (Google Play)
Scripts de release:
- `npm run android:clean`
- `npm run android:bundle:release` (gera `.aab`)
- `npm run android:apk:release` (gera APK release)

Guia completo de publicação:
- `docs/PLAY_STORE_TV_RELEASE.md`

## Estrutura importante
- `App.tsx`: UI principal + fluxo de tarefas
- `android/app/src/main/AndroidManifest.xml`: configuração Android TV (Leanback)
- `android/keystore.properties.example`: template de assinatura release

## Observações
- O projeto está preparado para Android TV (Leanback + touchscreen opcional).
- Não versionar keystores/senhas de produção.
