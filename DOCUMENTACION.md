# Documentación — Club de detective literario

Prototipo de lectura gamificada para estudiantes de 8 a 15 años. El detective lee un fragmento (clásico o autor local) **una palabra a la vez**, responde tres pistas de opción múltiple y suma puntos a una liga semanal por banda de edad.

Este documento describe cómo está armado el programa, cómo se juega y cómo se calculan los puntos. El `README.md` es la guía corta de arranque; aquí está el mapa completo.

No es un producto de producción: no hay autenticación real, ni base remota, ni panel editorial.

---

## 1. Cómo correrlo

Requisitos: Node.js y [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm db:seed
pnpm dev
```

La app queda en [http://127.0.0.1:4317](http://127.0.0.1:4317).

La primera visita también crea `data/club.db` y carga el seed si la base está vacía. El archivo de base no se versiona.

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo en el puerto **4317** |
| `pnpm build` / `pnpm start` | Build de producción y servidor en 4317 |
| `pnpm test` | Pruebas de puntuación y de speed reading (Vitest) |
| `pnpm db:seed` | Carga autores, casos, preguntas y detectives de relleno |
| `pnpm lint` | ESLint |

---

## 2. Qué ve el estudiante

### Portada (`/`)

Si no hay cookie de detective, pide un nombre (2–24 caracteres) y una banda:

| Banda interna | Alias en pantalla | Edades |
| --- | --- | --- |
| `8-11` | **Junior** | 8 a 11 años |
| `12-15` | **Cadete** | 12 a 15 años |

Se guarda un id en la cookie `club_player_id` (httpOnly, un año). No hay login, correo ni contraseña. Desde **Perfil** se puede salir y volver a entrar con otro nombre.

### Aprender (`/inicio`)

Tren vertical de lecturas (Express literario). Folio va en la locomotora; cada caso es un vagón; al final hay un furgón-estación.

- El primer vagón está abierto.
- Los demás se desbloquean al **cerrar** el anterior.
- El vagón actual lleva la etiqueta **Sube aquí**.
- Junior y Cadete tienen convoyes distintos.

**Junior — Convoy 1**

1. El caballero y los gigantes (Cervantes)
2. Volcanes enamorados (Leyenda del Anáhuac)
3. Platero y la luna (Juan Ramón Jiménez)
4. El maíz sagrado (Tradición nahua)

**Cadete — Convoy 1**

1. Nadie (Homero)
2. La frontera de Fierro (José Hernández)
3. El ciego y el mozo (Lazarillo)
4. Un verso en la celda (Sor Juana)

### Caso (`/caso/[id]`)

1. Speed reading del fragmento.
2. Al terminar la última palabra, pasan las tres pistas.
3. Cada pista: una respuesta, feedback y, si falló, un segundo intento.
4. Resumen de puntos y enlace a la liga.

### Ranking (`/ranking`)

Liga de la semana (lunes a domingo) **solo de la banda del detective**. Hay bots de seed para que la tabla no esté vacía.

Orden:

1. Más puntos de la semana (solo sesiones que cuentan para ranking).
2. Más casos cerrados.
3. Mejor acierto al primer intento.

### Perfil (`/perfil`)

Nombre, banda, racha, XP de la semana, casos cerrados y **medallas por autor** (no suman a la liga).

---

## 3. Loop de un caso

```
startSession → lectura RSVP → completeReading
     → submitAnswer (hasta 2 intentos por pista)
     → finishSession → resumen
```

Las reglas viven en el servidor (`app/actions/game.ts`). El cliente no decide los puntos.

| Acción | Efecto |
| --- | --- |
| `startSession` | Abre o reanuda una sesión `reading` / `question` |
| `completeReading` | Guarda ppm, marca si se mostró el texto y entrega la pista 1 |
| `submitAnswer` | Valida intento, tiempo y puntos; avanza o permite reintento |
| `finishSession` | Cierra el caso, aplica bonus de caso limpio y de racha |

Una sesión reabriéndose no crea otra fila: si ya hay una `reading` o `question` de ese detective y caso, se reutiliza.

Estados: `reading` → `question` → `completed`.

---

## 4. Speed reading

El texto se parte por espacios. Los guiones (`-`, `–`, `—`) se **omiten** y no rompen la palabra (`pre-guerra` → `preguerra`). La puntuación se **queda pegada** (`Hola,`, `¿Qué`, `¡Alto!`).

Cada palabra se alinea en la **segunda letra** (punto de reconocimiento), pintada de rojo claro (`#F07A88`). El resto va en azul.

Si solo hay **una letra** (`a`, `y`, `o`, `y.`), esa letra va **al centro** y también en rojo claro.

Ritmo:

| | Valor |
| --- | --- |
| Mínimo | 80 ppm |
| Junior por defecto | 140 ppm |
| Cadete por defecto | 180 ppm |
| Máximo | **1000 ppm** |
| Control | Deslizador, chips 80 / 140 / 300 / 600 / 1000, botones ±50 |

Al terminar la última palabra se llama `completeReading` con `{ wpm, wordsPresented }` y se entra de una a las pistas.

La lectura “cuenta” si se mostraron al menos tantas palabras como el `wordCount` del caso, o si pasó el tiempo mínimo (`ceil(palabras / 9)` segundos). Si no, hay penalización (ver puntuación).

Código: `lib/speed-reading.ts`, `components/speed-reader.tsx`.

---

## 5. Puntuación

Motor puro en `lib/scoring/engine.ts`. Pruebas en `lib/scoring/engine.test.ts`.

### Por pista

| Resultado | Base | ¿Multiplicador? |
| --- | --- | --- |
| Acierto al primer intento, lectura completa | 100 | Sí |
| Acierto al primer intento, lectura incompleta | 70 | No (se queda en ×1) |
| Acierto al segundo intento | 40 | No |
| Fallo | 0 | — |

Puntos finales del acierto:

```
puntos = redondear(base × multiplicador_lectura × multiplicador_respuesta)
```

El extra de velocidad que se muestra en el resumen es `puntos − base` (puede ser negativo: **-16**, no `+-16`).

### Multiplicador de lectura (ppm)

Anclado en 140 ppm = ×1. Curva suave hasta 1000 ppm = ×2. Por debajo de 140 baja hasta ×0.85 a 80 ppm.

| ppm | × aprox. |
| --- | --- |
| 80 | 0.85 |
| 140 | 1.00 |
| 280 | 1.35 |
| 1000 | 2.00 |

### Multiplicador de respuesta

Tiempo desde que el servidor abre la pista:

| Tiempo | × |
| --- | --- |
| ≤ 5 s | 1.20 |
| ≤ 10 s | 1.10 |
| ≤ 20 s | 1.05 |
| más | 1.00 |

Tope combinado razonable: 2.00 × 1.20 = **×2.4**.

El multiplicador se **anula** (queda ×1) si:

- no se cumplió la lectura mínima, o
- el acierto al primer intento del día (en casos ya cerrados) está por debajo del 40%.

### Al cerrar el caso

| Concepto | Cómo |
| --- | --- |
| Aciertos | Suma de las bases (100 / 70 / 40) |
| Velocidad | Suma de (`puntos − base`); en UI: `Velocidad ×N (ppm)` |
| Caso limpio | 80 si 3/3 al primer intento; 40 si 2/3; 0 si menos |
| Racha | 50 / 100 / 200 al cumplir 3 / 5 / 7 días seguidos (una vez por umbral) |
| Total | aciertos + velocidad + caso limpio + racha |

La racha no se multiplica por velocidad.

Máximo **8 casos al día** cuentan para la liga. Los siguientes sí suman a medallas y racha, pero no al ranking semanal.

---

## 6. Racha y medallas

**Racha.** Un día calendario con al menos un caso cerrado. Día consecutivo: +1. Hueco: vuelve a 1. El mismo día no incrementa otra vez.

**Medallas por autor** (fuera de la liga):

| Nivel | Casos de ese autor |
| --- | --- |
| Bronce | 5 |
| Plata | 15 |
| Oro | 30 |

En el prototipo cada autor tiene un solo caso, así que el progreso de medalla se ve, pero no se llena en una demo corta.

---

## 7. Identidad, datos y seed

- Identidad = cookies `club_player_id` y `club_state` (nombre, racha, sesiones).
- Casos y pistas = `data/seed-cases.json` (sin consultar SQLite en cada página).
- Opcional en local: SQLite `data/club.db` vía `pnpm db:seed` (el loop de juego ya no lo usa).
- Seed: `data/seed-cases.json` → `lib/db/seed.ts`. 8 autores, 8 casos (4 por banda), 3 preguntas MC cada uno, y detectives bot para la liga.

Tablas: `players`, `authors`, `cases`, `questions`, `options`, `game_sessions`, `answers`.

---

## 8. Mapa del código

```
app/
  page.tsx                 Portada / onboarding
  actions/player.ts        Crear detective y salir
  actions/game.ts          Sesión, lectura, respuestas, cierre
  (club)/inicio            Tren de casos
  (club)/caso/[id]         Lectura + pistas + resumen
  (club)/ranking           Liga semanal
  (club)/perfil            Racha y medallas
components/
  reading-path.tsx         Tren vertical
  speed-reader.tsx         RSVP, ppm, alineación
  case-play.tsx            Orquesta el caso
  score-summary.tsx        Desglose final
  book-mascot.tsx          Folio
lib/
  scoring/engine.ts        Reglas numéricas
  speed-reading.ts         Partir palabras y ORP
  reading-path.ts          Orden y candados
  bands.ts                 Junior / Cadete
  db/                      SQLite, esquema, seed
  queries.ts               Ranking, casos, perfil
```

Paleta: blanco, rojo `#C41E3A`, azul `#1E4B8E`.

Stack: Next.js 16 (App Router), TypeScript, Tailwind, shadcn/ui, Drizzle, SQLite. Server Actions para el juego. Puerto de demo **4317**.

---

## 9. Qué queda fuera (a propósito)

| En este prototipo | En un producto real |
| --- | --- |
| Cookie local con nombre y edad | Auth, consentimiento parental, varios dispositivos |
| Un archivo SQLite (en Vercel, `/tmp` efímero) | PostgreSQL, Turso o Redis |
| 8 casos precargados | Pipeline IA + aprobación humana |
| Timers con timestamps de servidor | Validación estricta si se mata la pestaña |
| Ranking recalculado al entrar | Tabla materializada y caché |
| Sin pagos ni escuelas | Cuentas de aula, reportes, CMS |

---

## 10. Cómo ampliarlo

- **Otro caso:** agrégalo en `data/seed-cases.json` (autor, `ageBand`, fragmento, 3 preguntas con una correcta) y su id en `lib/reading-path.ts`. Borra `data/club.db` o corre el seed en una base vacía.
- **Cambiar puntos:** edita `lib/scoring/engine.ts` y las pruebas en `lib/scoring/engine.test.ts`.
- **Cambiar ppm o alineación:** `lib/speed-reading.ts` y los tope/presets también en `components/speed-reader.tsx` (`PPM_MAX = 1000`).

---

## 11. Publicar en Vercel

El prototipo está preparado para `npx vercel --prod`. El progreso viaja en cookies para que Aprender, Ligas y Perfil carguen en serverless.

```bash
npx vercel@latest login
npx vercel@latest --prod --yes
```
