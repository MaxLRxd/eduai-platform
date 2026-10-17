# Graph Report - eduai-platform  (2026-10-16)

## Corpus Check
- 13 files · ~86,971 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 223 nodes · 275 edges · 10 communities (8 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
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

## God Nodes (most connected - your core abstractions)
1. `scripts` - 12 edges
2. `NotificacionesPage()` - 12 edges
3. `LocalStorage` - 6 edges
4. `IStorage` - 5 edges
5. `S3Storage` - 5 edges
6. `App()` - 4 edges
7. `useNotificaciones()` - 4 edges
8. `useNoLeidasCount()` - 4 edges
9. `useMarcarLeida()` - 4 edges
10. `useMarcarTodasLeidas()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `useNoLeidasCount()` --indirect_call--> `getNoLeidasCount()`  [INFERRED]
  frontend/src/hooks/useNotificaciones.ts → frontend/src/services/notificaciones.service.ts
- `App()` --calls--> `NotificacionesPage()`  [EXTRACTED]
  frontend/src/App.tsx → frontend/src/pages/common/NotificacionesPage.tsx
- `App()` --calls--> `ProtectedRoute()`  [EXTRACTED]
  frontend/src/App.tsx → frontend/src/router/ProtectedRoute.tsx
- `Header()` --calls--> `useNoLeidasCount()`  [EXTRACTED]
  frontend/src/components/layout/Header.tsx → frontend/src/hooks/useNotificaciones.ts
- `NotificacionesPage()` --calls--> `Table()`  [EXTRACTED]
  frontend/src/pages/common/NotificacionesPage.tsx → frontend/src/components/ui/Table.tsx

## Import Cycles
- None detected.

## Communities (10 total, 2 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (41): author, description, keywords, license, main, name, prisma, seed (+33 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (13): env, envSchema, parsed, dest, IStorage, LocalStorage, S3Storage, storage (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (15): Table(), Td(), Th(), Thead(), Tr(), useMarcarLeida(), useMarcarTodasLeidas(), useNotificaciones() (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (19): devDependencies, eslint, jest, supertest, @swc/core, @swc/jest, tsx, @types/bcryptjs (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (17): dependencies, @aws-sdk/client-s3, @aws-sdk/lib-storage, bcryptjs, cookie-parser, cors, dotenv, express (+9 more)

### Community 6 - "Community 6"
Cohesion: 0.19
Nodes (3): Header(), PROFILE_PATH_BY_ROLE, useNoLeidasCount()

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (12): scripts, build, db:deploy, db:generate, db:migrate, db:seed, db:studio, dev (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.67
Nodes (3): App(), Shell(), ProtectedRoute()

## Knowledge Gaps
- **92 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+87 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 173 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _92 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.03389830508474576 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `Community 5` to `Community 1`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
- **Why does `zod` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08465608465608465 - nodes in this community are weakly interconnected._