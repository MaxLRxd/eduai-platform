---
type: "query"
date: "2026-09-13T21:17:20.866952+00:00"
question: "Why does AppError bridge 21 communities?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["AppError", "error.ts", "errorHandler", "notFound"]
---

# Q: Why does AppError bridge 21 communities?

## Answer

Expanded from original query via vocab: [app, error]. Then traced the AppError node (backend_src_middlewares_error_apperror). AppError is a small HTTP-error class in backend/src/middlewares/error.ts (loc=L3): an Error subclass carrying only statusCode + message. It bridges ~21-22 backend communities because it is the single centralized error abstraction: 34 EXTRACTED imports edges (every controller/service file imports it), 114 EXTRACTED calls edges (nearly every route handler and use-case does throw new AppError(...)), plus 1 contains + 1 method edge to its file node and .constructor(). The central errorHandler (error.ts L16-29) converts any AppError into a status code + JSON body and any other Error into a generic 500. That star topology is the load-bearing seam of the backend: modules never call each other directly; they all agree on AppError, so it becomes the top god node (150 edges, betweenness 0.056).

## Outcome

- Signal: useful

## Source Nodes

- AppError
- error.ts
- errorHandler
- notFound