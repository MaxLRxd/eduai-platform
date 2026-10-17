# Graph Report - eduai-platform  (2026-10-16)

## Corpus Check
- 4 files · ~86,823 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 279 nodes · 385 edges · 16 communities (10 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10

## God Nodes (most connected - your core abstractions)
1. `NotificacionesPage()` - 12 edges
2. `scripts` - 12 edges
3. `guardarArchivo()` - 10 edges
4. `obtenerActividadODefecto()` - 8 edges
5. `obtenerMateriaDeSeccion()` - 8 edges
6. `toEntregaDto()` - 6 edges
7. `eliminarArchivo()` - 5 edges
8. `corregirConIA()` - 5 edges
9. `toContenidoDto()` - 5 edges
10. `crearArchivo()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `useNoLeidasCount()` --indirect_call--> `getNoLeidasCount()`  [INFERRED]
  frontend/src/hooks/useNotificaciones.ts → frontend/src/services/notificaciones.service.ts
- `App()` --calls--> `NotificacionesPage()`  [EXTRACTED]
  frontend/src/App.tsx → frontend/src/pages/common/NotificacionesPage.tsx
- `subirArchivoEntrega()` --calls--> `guardarArchivo()`  [EXTRACTED]
  backend/src/modules/actividades/actividades.service.ts → backend/src/config/storage.ts
- `crearArchivo()` --calls--> `guardarArchivo()`  [EXTRACTED]
  backend/src/modules/contenidos/contenidos.service.ts → backend/src/config/storage.ts
- `eliminar()` --calls--> `eliminarArchivo()`  [EXTRACTED]
  backend/src/modules/contenidos/contenidos.service.ts → backend/src/config/storage.ts

## Import Cycles
- None detected.

## Communities (16 total, 6 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (40): author, description, keywords, license, main, name, prisma, seed (+32 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (19): actualizar(), actualizarRubrica(), corregir(), corregirConIA(), crearRubrica(), eliminar(), eliminarRubrica(), EntregaBase (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (15): Table(), Td(), Th(), Thead(), Tr(), useMarcarLeida(), useMarcarTodasLeidas(), useNotificaciones() (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (12): actualizar(), crear(), crearArchivo(), eliminar(), EXTENSIONES, inferirTipo(), listarPorSeccion(), obtenerContenidoYVerificarEscritura() (+4 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (18): env, envSchema, parsed, asegurarDirectorioUploads(), clienteS3(), eliminarArchivo(), formatoDe(), guardarArchivo() (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (19): devDependencies, eslint, jest, supertest, @swc/core, @swc/jest, tsx, @types/bcryptjs (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (17): dependencies, @aws-sdk/client-s3, @aws-sdk/lib-storage, bcryptjs, cookie-parser, cors, dotenv, express (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.19
Nodes (3): Header(), PROFILE_PATH_BY_ROLE, useNoLeidasCount()

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (12): scripts, build, db:deploy, db:generate, db:migrate, db:seed, db:studio, dev (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.67
Nodes (3): App(), Shell(), ProtectedRoute()

## Knowledge Gaps
- **93 isolated node(s):** `author`, `description`, `keywords`, `license`, `main` (+88 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 186 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@prisma/client` connect `Community 4` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **What connects `author`, `description`, `keywords` to the rest of the system?**
  _93 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.03389830508474576 - nodes in this community are weakly interconnected._
- **Why does `devDependencies` connect `Community 6` to `Community 1`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `Community 7` to `Community 1`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11693548387096774 - nodes in this community are weakly interconnected._