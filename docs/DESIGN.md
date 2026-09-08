# Sistema visual — Guillo Guambi

Actualizado: 2026-09-08

## Dirección

Editorial de obra: superficies cálidas, negro técnico y naranja de acción. Las fotografías sin maquillar y las líneas de medición son el elemento firma. Las imágenes de servicios son contexto editorial generado; la galería queda reservada exclusivamente para trabajos reales.

## Tokens

- Acción `--orange: #f26a2e`; acción con contraste sobre claro `--orange-dark: #c94713`.
- Tinta `--ink: #151512`; papel `--paper: #f2f0e9`; papel profundo `--paper-2: #e7e3d8`; blanco cálido `--white: #fffef8`.
- Estados: `--success: #17673f`, `--danger: #a52b20`; texto secundario `--muted: #66655e`.
- Bordes rectos, sombras contenidas y máximo un efecto protagonista por vista.

## Tipografía y ritmo

Geist para lectura y titulares; Geist Mono para rótulos técnicos, índices y estados. Los titulares usan tracking negativo; los rótulos, mayúsculas y tracking positivo. Base móvil 390×844 con escalado en `min-width: 641px` y `901px`.

## Componentes

- Hero: imagen visible en la mitad superior, copy sobre gradiente inferior y primera pantalla cerrada por la franja de tres especialidades.
- Tarjetas de diagnóstico y servicio: imagen 4:2.45, índice técnico, copy breve y CTA contextual.
- Galería: dos tarjetas visibles en móvil, seis slots, snap horizontal y selector Antes/Después.
- Modal de valoración: máximo dos pasos, sin scroll a 390×844; progreso naranja, errores inline y confirmación diseñada.
- Panel: navegación compacta en móvil y lateral en escritorio; seis editores independientes, solicitudes privadas y seguridad.

## Motion y accesibilidad

Entradas de 650 ms con easing `cubic-bezier(.22,1,.36,1)`, interacciones de 200–350 ms y alternancia de galería cada 4,2 s. `prefers-reduced-motion` elimina desplazamientos y reproducción automática de estado. Foco visible, labels reales, navegación por teclado, textos alternativos y contraste AA.
