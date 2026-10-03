# Vía Beta 0.1.0 — Android

Este proyecto está preparado para dos formas de probar Vía:

1. **Web/PWA:** `npm run build` y servir `dist/` por HTTPS. En Android se puede instalar desde el navegador.
2. **APK:** `npx cap add android`, `npx cap sync android` y `cd android && ./gradlew assembleDebug`.

## Datos de la app
- Nombre: Vía
- Versión: 0.1.0
- ID: com.via.botbuilder
- Formato Play Store futuro: AAB firmado

## Compilación en la nube
El workflow `.github/workflows/android-beta.yml` crea un proyecto Android desde Capacitor y publica el APK debug como artifact. Esto permite compilar desde un teléfono sin instalar Android Studio.

El APK debug sirve para pruebas. Para Google Play se necesita una compilación release firmada con una clave de firma que debe conservar el propietario de la app.
