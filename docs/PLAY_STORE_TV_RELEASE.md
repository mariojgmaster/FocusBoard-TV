# Google Play Release (Android TV) - FocusBoard TV

## 1) Prerequisites
- JDK 17+ instalado
- Android SDK/NDK configurado
- Conta Google Play Console ativa

## 2) Keystore de release
Crie um keystore de producao (uma unica vez):

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore keystores/focusboard-tv-release.keystore -alias focusboardtv -keyalg RSA -keysize 4096 -validity 10000
```

Copie `android/keystore.properties.example` para `android/keystore.properties` e preencha:

```properties
storeFile=../../keystores/focusboard-tv-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=focusboardtv
keyPassword=YOUR_KEY_PASSWORD
```

## 3) Versionamento
Atualize em `android/app/build.gradle`:
- `versionCode`: incremente a cada envio
- `versionName`: ex. `1.0.0`, `1.0.1`

## 4) Build de release
Gerar App Bundle (formato recomendado pela Play Store):

```powershell
npm run android:bundle:release
```

Saida:
- `android/app/build/outputs/bundle/release/app-release.aab`

Opcional (APK release local):

```powershell
npm run android:apk:release
```

## 5) Publicacao no Google Play Console
1. Crie o app no Play Console.
2. Configure a ficha da loja (nome, descricao curta/longa, icones, screenshots).
3. Configure **Data safety** e **App access**.
4. Envie o arquivo `.aab` em uma track (`Internal testing` recomendado primeiro).
5. Resolva avisos/erros de politica, compatibilidade e target API.
6. Promova para `Production` quando validado.

## 6) Checklist Android TV
- Manifest com:
  - `android.software.leanback` (`required=true`)
  - `android.hardware.touchscreen` (`required=false`)
  - categoria `LEANBACK_LAUNCHER`
- Banner de TV configurado via `android:banner` (`@drawable/tv_banner`)
- Navegacao 100% D-Pad (sem touch obrigatorio)
- Layout em landscape e legivel a distancia

## 7) Scripts uteis
- `npm run android:tv` - roda no emulador TV conectado
- `npm run android:pick` - escolhe dispositivo
- `npm run android:clean` - limpa build Android
- `npm run android:bundle:release` - gera AAB

## 8) Observacoes importantes
- Nunca versione `android/keystore.properties` nem arquivos de keystore.
- Se usar Play App Signing (recomendado), guarde o upload key com backup seguro.
- Faca rollout gradual na primeira versao para reduzir risco.

