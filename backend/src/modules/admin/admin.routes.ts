import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { requireAuth, requireRole } from "../../middlewares/auth";
import {
  actualizarEstadoSchema,
  actualizarMateriaAdminSchema,
  asignarProfesorSchema,
  cambiarRolSchema,
  crearMateriaAdminSchema,
  crearUsuarioSchema,
} from "./admin.schemas";
import * as adminController from "./admin.controller";

const router = Router();

router.get("/admin/users", requireAuth, requireRole("ADMIN"), adminController.listarUsuarios);
router.post(
  "/admin/users",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(crearUsuarioSchema),
  adminController.crearUsuario
);
router.patch(
  "/admin/users/:usuarioId/estado",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(actualizarEstadoSchema),
  adminController.actualizarEstado
);
router.patch(
  "/admin/users/:usuarioId/rol",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(cambiarRolSchema),
  adminController.cambiarRol
);

router.get("/admin/materias", requireAuth, requireRole("ADMIN"), adminController.listarMaterias);
router.post(
  "/admin/materias",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(crearMateriaAdminSchema),
  adminController.crearMateria
);
router.put(
  "/admin/materias/:materiaId",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(actualizarMateriaAdminSchema),
  adminController.actualizarMateria
);
router.post(
  "/admin/materias/:materiaId/profesores",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(asignarProfesorSchema),
  adminController.asignarProfesor
);

export default router;
