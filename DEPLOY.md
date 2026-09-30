# Deploy cloud — documento de decisión

> **Estado: ABIERTO.** No implementado. Requiere reunión de equipo.
> **Fecha:** 2026-09-28 · **Bloquea:** la entrega académica (`README.md:108`, tarea 0 del cronograma)

Este documento existe para discutirlo, no para dar por decidedo nada. Las secciones
**"Pendiente de decidir"** y **"Preguntas abiertas"** son las que hay que completar en la reunión.

---

## 1. Qué hay que decidir

| # | Decisión | Estado | Impacto |
|---|---|---|---|
| 1 | Proveedor de hosting para `backend` + `ai-service` | ⬜ abierto | Alto — define cold starts y costos |
| 2 | Dónde corre Postgres con `pgvector` | ⬜ abierto | Alto — performance del RAG |
| 3 | Si el frontend va a Vercel o se sirve con Nginx | ⬜ abierto | Bajo |
| 4 | Storage de archivos: R2 vs disco persistente | ⬜ abierto | Medio — ya hay interfaz preparada |
| 5 | Quién paga / de qué presupuesto salen los dominios y servicios | ⬜ abierto | Alto |

---

## 2. Lo que YA está resuelto y es agnóstico del proveedor

Esto no se rehace al elegir proveedor, ya está hecho y verificado:

- **Los tres servicios construyen y corren.** `docker compose build` levanta `db`, `redis`,
  `backend`, `ai-service` y `frontend` sin errores (verificado 2026-09-28, ver `AVANCE.md`).
- **Health checks ya existen** y son los que necesitan los providers:
  - `ai-service` → `GET /healthz` → `{"status":"ok"}`
  - `backend` → `GET /api/healthz` → `{"status":"ok","db":"ok"}` (incluye chequeo de DB)
- **Las migraciones aplican solas en deploy.** El `CMD` de producción del backend corre
  `prisma migrate deploy` antes de arrancar (`backend/Dockerfile`).
- **Redis es opcional.** `CacheService` degrada en silencio si no conecta
  (`ai-services/src/services/cache_service.py:20`): sin Redis no hay caché, pero la app funciona.
  Esto habilita tiers baratos sin romper nada.
- **Los scripts cross-platform** (`scripts/venv.mjs`) ya no dependen de Windows.

---

## 3. La trampa principal: 3 servicios = 3 cold starts

Este es el punto que más se subestima al elegir proveedor, así que va con números reales.

Un proyecto en Railway/Render es **un solo servicio**. Nosotros tenemos **tres**
(`backend`, `ai-service`, `frontend`). En tiers gratuitos **cada uno se duerme por separado**.

Una request que llega con los tres dormidos tiene que esperar **tres arranques en cadena**:

```
Vercel (1-2s) → backend (espera a su vez al ai-service) → ai-service
```

Y el que domina es el `ai-service`, porque ya de por sí es lento: con el modelo **caliente**,
`POST /tutor/resumen` tarda **26,7 s** medidos. Sumale el arranque del contenedor Python
(imports de `google-genai`, `fastapi`, `pinecone`...) y el primer request del día puede caer
fácilmente en el minuto.
si 
**Consecuencia práctica:** el cold start del `ai-service` es el que hay que evitar, no el del frontend.

### Qué proveedores lo resuelven bien

- **Fly.io:** permite varios servicios en una misma región y `fly machine start` para que
  un proceso no se suspenda. Se puede dejar el `ai-service` siempre encendido y el resto dormido.
- **Railway:** un proyecto con los tres servicios; el `ai-service` en plan siempre-activo.
- **Render / Vercel free:** **no recomendado**, por el cold start de Python descrito arriba.

---

## 4. Restricción: DB y `ai-service` en la misma región

Esto no es una preferencia, es una condición del diseño actual.

El RAG consulta Postgres en **cada** examen/resumen, y como el índice HNSW no se está usando
(ver `AVANCE.md`, sección "Gemini en producción"), cada búsqueda es un **escaneo secuencial**
de los vectores de la materia. Medido: 27 ms con 2.000 chunks, 140-390 ms con 10.000.

Si el `ai-service` despertara en una región distinta a la de Postgres, cada búsqueda cruza la red.
A volumen chico se tolera; a volumen real, no.

**Requisito para cualquier opción:** `ai-service` y Postgres en la misma región.

---

## 5. Sobre Postgres con `pgvector`

**No definido todavía.** Es la decisión más grande y conviene resolverla con calma.

Puntos a verificar antes de elegir (no los doy por sentado):

- Si el proveedor elegido es Postgres **gestionado**, confirmar que `pgvector` se puede habilitar
  y qué versión. Nuestro código usa el operador coseno `<=>`, que es estándar en `pgvector`.
- La columna está declarada `vector(3072)` en el esquema, así que la versión de la extensión
  tiene que soportar 3.072 dimensiones. Verificar antes de compromisingerse.
- Límites de storage del plan elegido: cada vector pesa ~13,5 KB (3072 floats). 10.000 chunks
  ≈ 134 MB. Es el costo que más crece.
- Si el plan gratuito tiene ventanas de mantenimiento o se pausa, el RAG paga ese arranque en frío.

> **Aclaración importante:** HNSW no funciona hoy (`3072 > 2000`, tope de `pgvector`), pero eso
> es independiente del proveedor. Hay una migración pendiente a `halfvec` que se decidió
> **no hacer todavía** por volumen bajo. Si algún día Postgres queda en un servicio que no
> soporta índices vectoriales, esa opción se vuelve irrelevante y la decisión cambia.

---

## 6. Opciones a comparar

Los costos son **aproximados y hay que confirmarlos** en la web antes de decidir.

### A) Fly.io — los tres servicios en una región  *(recomendación técnica)*

| | |
|---|---|
| **Cómo** | `fly launch` por servicio; los 3 en la misma región; `ai-service` sin suspender |
| **Costo** | ~USD 5-10/mes (3 máquinas siempre encendidas, la más chica es la cara) |
| **Pros** | Una sola región por defecto, health checks ya implementados, `fly machine` da control fino del sleep |
| **Contras** | Requiere tarjeta para el plan de pago; hay que aprender `fly.toml` |
| **Riesgo** | Si el `ai-service` se suspende igual, el problema del cold start sigue |

### B) Railway — un proyecto con los tres servicios

| | |
|---|---|
| **Cómo** | Un proyecto, 3 servicios; `ai-service` en always-on |
| **Costo** | ~USD 5/mes (similar a Fly) |
| **Pros** | Interfaz más simple que Fly; deploy desde GitHub sin CLI |
| **Contras** | Los servicios se pueden scheduling en zonas distintas si no se fuerza la región |
| **Riesgo** | El mismo punto: el cold start del `ai-service` |

### C) Render + Vercel (gratis) — **no recomendada**

| | |
|---|---|
| **Costo** | 0 |
| **Contras** | Cold start de Python de ~1 min en cada despertar; sin Redis persistente |
| **Veredicto** | Barata pero incompatible con un LLM que tarda 26 s. Solo para demo |

### D) VM propia (Hetzner/DigitalOcean)

| | |
|---|---|
| **Costo** | ~USD 5-15/mes |
| **Pros** | Control total, los 3 procesos en una máquina, sin cold starts entre servicios |
| **Contras** | Alguien tiene que mantener el sistema operativo y los updates |

---

## 7. Preguntas abiertas para la reunión

| # | Pregunta | Quién responde |
|---|---|---|
| 1 | ¿Hay presupuesto para servicios pagos, o tiene que ser free tier? | — |
| 2 | ¿Quién tiene cuenta / tarjeta para crear el proyecto? | — |
| 3 | ¿En qué región queda la DB y quién se asegura de que coincida? | — |
| 4 | ¿El deploy es manual o automático con GitHub Actions? (hoy el CI solo corre lint/test) | — |
| 5 | ¿Los archivos subidos por docentes van a R2 ya, o queda el disco hasta el final? | — |
| 6 | ¿Hace falta staging, o alcanza con un ambiente? | — |
| 7 | ¿Quién queda a cargo cuando algo se caiga en producción? | — |

---

## 8. Checklist antes de poder deployar

Independiente del proveedor, esto falta:

- [ ] Levantar el stack con `.env` de producción (sin valores de ejemplo)
- [ ] Verificar que `GEMINI_MODEL` sea un modelo **flash-lite** (los `flash` grandes dan 503)
- [ ] Correr `prisma migrate deploy` contra la DB de producción
- [ ] Definir política de backups de Postgres (hoy no hay ninguno)
- [ ] Revisar que los CORS allowlisteen el dominio real (`backend` y `frontend` se comunican)
- [ ] Configurar `UPLOAD_DIR` o R2 (`AI_SERVICE_URL`, `JWT_SECRET`, `DATABASE_URL`)
- [ ] Migrar los secretos a las variables de entorno del proveedor (nunca al repo)

---

## 9. Recomendación del equipo técnico (no es una decisión)

Si el presupuesto alcanza, **Fly.io con los tres servicios en una región y el `ai-service`
siempre encendido** es lo que menos riesgo mete para un MVP académico. Si el presupuesto es
cero, la alternativa sana es **Railway solo para el `ai-service`** y dejar `backend` + `frontend`
en el free tier: el único cold start que realmente molesta es el del `ai-service`.

Lo que **no** se recomienda es desplegar todo en free tier y descubrir el problema en la
demostración final.
