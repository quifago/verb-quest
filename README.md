# Verb Quest

Juego de los 82 verbos irregulares de 1.º de ESO, con Slot Machine como modo inicial y un modo clásico alternativo. Conserva los rodillos táctiles, los sonidos y la vibración cuando el dispositivo la admite.

## Desarrollo

Requiere Node.js 22.13 o superior.

```sh
npm ci
npm run dev
```

## Publicación

```sh
npm run build
npm run preview
```

Cada push a `main` compila y publica `dist/` en GitHub Pages mediante GitHub Actions.

Sitio: https://quifago.github.io/verb-quest/

La aplicación funciona en el navegador, sin servidor ni credenciales. El sonido se activa al empezar la partida; la vibración depende de la compatibilidad del dispositivo y del navegador.
