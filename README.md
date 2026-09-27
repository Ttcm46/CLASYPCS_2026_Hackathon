# Club de detective literario

Prototipo de lectura gamificada para estudiantes de 8 a 15 años. Cada caso es un fragmento corto (clásico o autor local), tres preguntas de opción múltiple y un cierre con puntos. El ranking semanal se separa por banda de edad.

Este repositorio demuestra el loop de juego y las reglas de puntuación del brief. No es un sistema listo para producción.

La documentación completa del programa (flujo, puntuación, tren, speed reading y mapa de código) está en [DOCUMENTACION.md](./DOCUMENTACION.md). El pitch de 3–4 minutos (inglés sencillo) está en [PITCH.md](./PITCH.md).

## Cómo correrlo

```bash
pnpm install
pnpm db:seed
pnpm dev
```

La app queda en [http://127.0.0.1:4317](http://127.0.0.1:4317). El detective y su progreso se guardan en cookies (así las páginas cargan en Vercel). `pnpm db:seed` sigue creando `data/club.db` para uso local opcional. La primera visita también crea `data/club.db` y carga el seed si la base está vacía.

```bash
pnpm test
```

corre las pruebas del motor de puntuación.

## Guion de demo (2–3 minutos)

1. Abre la portada y entra con un nombre de detective. Elige **Junior** (8–11) o **Cadete** (12–15).
2. En **Aprender**, recorre el **tren de lecturas**: cada caso es un vagón. El primero está abierto; los demás se desbloquean al cerrar el anterior.
3. Folio muestra el fragmento **una palabra a la vez**, alineada en la segunda letra (si solo hay una, va al centro y también en rojo claro). El ritmo va de 80 a **1000 ppm** y multiplica los puntos con una curva suave. Al terminar, entras de una vez a las tres pistas.
4. Al cerrar el caso verás el desglose: aciertos, extra por velocidad, bonus de caso limpio y, si aplica, racha.
5. Revisa **Ranking** (ya hay detectives del club para que la tabla no esté vacía) y **Perfil** (racha y progreso hacia medallas por autor).

## Qué demuestra

- Speed reading (una palabra a la vez, alineada en la segunda letra, medido en ppm) → 3 preguntas → feedback
- Puntos base × multiplicador de velocidad (lectura 80–1000 ppm, ×0.85 a ×2, y un extra suave por tiempo de respuesta)
- Categorías **Junior** (8–11) y **Cadete** (12–15)
- Reglas numéricas del brief en `lib/scoring/engine.ts`
- Ranking semanal (lunes–domingo) con desempate por casos y acierto al primer intento
- Medallas por autor (bronce 5 / plata 15 / oro 30) fuera del ranking

## Qué queda fuera (a propósito)

| En el prototipo | En un producto real |
| --- | --- |
| Cookie local con nombre y edad | Auth, consentimiento parental, multi-dispositivo |
| SQLite en un archivo | PostgreSQL + Redis |
| 4 casos precargados | Pipeline IA + aprobación humana |
| Timers con timestamps de servidor | Validación estricta ante background/kill |
| Ranking recalculado en cada visita | Tabla materializada y caché |

## Vercel

El prototipo se puede publicar en Vercel. El detective y el progreso van en cookies, y los casos salen del JSON de seed. Así Aprender, Ligas y Perfil no dependen de SQLite en `/tmp`.

```bash
npx vercel@latest login
npx vercel@latest --prod --yes
```

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui, Drizzle y SQLite. Server Actions para el loop de juego. Sin Docker y sin secretos obligatorios.
