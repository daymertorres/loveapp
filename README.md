# LoveTrack - App Web PWA para Parejas ❤️

LoveTrack es una aplicación web moderna (PWA) enfocada en la comunicación y compartición de ubicación en tiempo real para parejas.

## Tecnologías Utilizadas
- HTML5
- CSS3 (Vanilla, diseño premium, Glassmorphism, Dark/Light Mode)
- JavaScript Vanilla (ES6+)
- Leaflet.js para el mapa
- Firebase (Preparado para Auth, Firestore, Realtime Database)
- PWA (Service Worker y Manifest)

## Estructura
- `/index.html`: Splash y entrada.
- `/home.html`: Dashboard principal con widgets de ubicación y batería.
- `/map.html`: Mapa en tiempo real.
- `/chat.html`: Chat privado.
- `/moments.html`: Galería de recuerdos.
- `/profile.html`: Configuración de cuenta.
- `/css/style.css`: Hojas de estilo unificadas y optimizadas.
- `/js/`: Lógica dividida en módulos.

## Instalación y Ejecución Local
1. Clona el repositorio.
2. Abre la carpeta del proyecto en tu editor preferido (ej: VS Code).
3. Utiliza la extensión `Live Server` o cualquier servidor HTTP estático para servir la carpeta raíz.

## Configuración de Firebase
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Copia tu objeto de configuración.
3. Pega la configuración en el archivo `js/firebase.js`.
4. Descomenta las líneas de inicialización en `js/firebase.js`, `js/auth.js`, etc.

## Despliegue
Este proyecto incluye un `vercel.json` y está listo para ser desplegado directamente en [Vercel](https://vercel.com).
Solo necesitas vincular tu repositorio de GitHub a Vercel. No requiere comandos de build (`npm run build`), ya que es Vanilla puro.
