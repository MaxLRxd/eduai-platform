import React, { useState } from "react";
import { useChangeAdminUserRole, useCreateAdminUser, useAdminUsers, useSetAdminUserActive } from "../../hooks/useAdminUsers";
import { ApiError } from "../../services/api";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import { Tag, type TagColor } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import type { AdminUser, UserRole, UserStatus } from "../../types/domain";

type AdminRolInput = "ALUMNO" | "PROFESOR" | "ADMIN";

const ROLE_COLOR: Record<UserRole, TagColor> = { Docente: "blue", Admin: "purple", Alumno: "green" };
const STATUS_COLOR: Record<UserStatus, TagColor> = { Activo: "green", Pendiente: "amber", Inactivo: "red" };
const ROLE_TO_API: Record<string, AdminRolInput> = { Docente: "PROFESOR", Admin: "ADMIN", Alumno: "ALUMNO" };

function messageFromError(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    try {
      const parsed = JSON.parse(e.message) as { error?: string };
      if (parsed.error) return parsed.error;
    } catch {
      // cuerpo no JSON
    }
    return `Ocurrió un error (HTTP ${e.status}).`;
  }
  return fallback;
}

export function AdminUsuariosPage(): React.ReactElement {
  const { data: users, isLoading } = useAdminUsers();
  const create = useCreateAdminUser();
  const setActive = useSetAdminUserActive();
  const changeRole = useChangeAdminUserRole();

  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; user: AdminUser } | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<AdminRolInput>("ALUMNO");
  const [tipoProfesor, setTipoProfesor] = useState("TITULAR");
  const [modalMsg, setModalMsg] = useState("");

  const openCreate = (): void => {
    setNombre("");
    setEmail("");
    setPassword("");
    setRol("ALUMNO");
    setTipoProfesor("TITULAR");
    setModalMsg("");
    setModal({ mode: "create" });
  };

  const openEdit = (u: AdminUser): void => {
    setNombre(u.name);
    setEmail(u.email);
    setPassword("");
    setRol(ROLE_TO_API[u.role] ?? "ALUMNO");
    setTipoProfesor("TITULAR");
    setModalMsg("");
    setModal({ mode: "edit", user: u });
  };

  const submitCreate = (): void => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setModalMsg("Completá nombre, email y contraseña.");
      return;
    }
    create.mutate(
      { nombre: nombre.trim(), email: email.trim(), password, rol, tipoProfesor },
      {
        onSuccess: () => {
          setModal(null);
        },
        onError: (e) => setModalMsg(messageFromError(e, "No se pudo crear el usuario.")),
      }
    );
  };

  const submitRole = (): void => {
    if (!modal || modal.mode !== "edit") return;
    changeRole.mutate(
      { usuarioId: modal.user.id, rol, tipoProfesor },
      {
        onSuccess: () => setModal(null),
        onError: (e) => setModalMsg(messageFromError(e, "No se pudo cambiar el rol.")),
      }
    );
  };

  const toggleActive = (u: AdminUser): void => {
    setActive.mutate({ usuarioId: u.id, activo: u.status !== "Activo" });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Usuarios del sistema</h2>
        <p className="text-[13px] text-text-2">Gestión de roles, estado y altas institucionales</p>
      </div>

      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={openCreate}>
          + Nuevo usuario
        </Button>
      </div>

      {isLoading && <p className="text-sm text-text-2">Cargando usuarios…</p>}

      <TableWrap>
        <Table ariaLabel="Usuarios registrados">
          <Thead>
            <tr>
              <Th>Usuario</Th>
              <Th>Email</Th>
              <Th>Rol</Th>
              <Th>Estado</Th>
              <Th>Acciones</Th>
            </tr>
          </Thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.email} className="hover:bg-surface-2">
                <Td className="font-semibold text-text-1">{u.name}</Td>
                <Td className="font-mono text-xs">{u.email}</Td>
                <Td>
                  <Tag color={ROLE_COLOR[u.role]}>{u.role}</Tag>
                </Td>
                <Td>
                  <Tag color={STATUS_COLOR[u.status]}>{u.status}</Tag>
                </Td>
                <Td>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                      Rol
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(u)}
                      disabled={setActive.isPending}
                    >
                      {u.status === "Activo" ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
            {!isLoading && (users ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-2.5 text-xs text-text-2">
                  No hay usuarios cargados.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableWrap>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? `Cambiar rol de ${modal.user.name}` : "Nuevo usuario"}
      >
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="admin-user-nombre" className="block text-xs font-semibold text-text-1 mb-1.5">
              Nombre
            </label>
            <input
              id="admin-user-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
          </div>
          <div>
            <label htmlFor="admin-user-email" className="block text-xs font-semibold text-text-1 mb-1.5">
              Email
            </label>
            <input
              id="admin-user-email"
              value={email}
              disabled={modal?.mode === "edit"}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm disabled:bg-surface-2 disabled:text-text-3"
            />
          </div>
          {modal?.mode === "create" && (
            <div>
              <label htmlFor="admin-user-password" className="block text-xs font-semibold text-text-1 mb-1.5">
                Contraseña (mín. 6 caracteres)
              </label>
              <input
                id="admin-user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded text-sm"
              />
            </div>
          )}
          <div>
            <label htmlFor="admin-user-rol" className="block text-xs font-semibold text-text-1 mb-1.5">
              Rol
            </label>
            <select
              id="admin-user-rol"
              value={rol}
              onChange={(e) => setRol(e.target.value as AdminRolInput)}
              className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
            >
              <option value="ALUMNO">Alumno</option>
              <option value="PROFESOR">Docente</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          {rol === "PROFESOR" && (
            <div>
              <label htmlFor="admin-user-tipo" className="block text-xs font-semibold text-text-1 mb-1.5">
                Tipo de docente
              </label>
              <select
                id="admin-user-tipo"
                value={tipoProfesor}
                onChange={(e) => setTipoProfesor(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
              >
                <option value="TITULAR">Titular</option>
                <option value="ADJUNTO">Adjunto</option>
              </select>
            </div>
          )}
          {modalMsg && <p className="text-xs text-danger">{modalMsg}</p>}
          <div className="flex gap-2 mt-1">
            <Button
              size="sm"
              onClick={modal?.mode === "edit" ? submitRole : submitCreate}
              disabled={create.isPending || changeRole.isPending}
            >
              {create.isPending || changeRole.isPending ? "Guardando…" : "Guardar"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setModal(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}