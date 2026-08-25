import React from "react";
import { useAdminUsers } from "../../hooks/useAdminUsers";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import { Tag, type TagColor } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import type { UserRole, UserStatus } from "../../types/domain";

const ROLE_COLOR: Record<UserRole, TagColor> = { Docente: "blue", Admin: "purple", Alumno: "green" };
const STATUS_COLOR: Record<UserStatus, TagColor> = { Activo: "green", Pendiente: "amber", Inactivo: "red" };

export function AdminUsuariosPage(): React.ReactElement {
  const { data: users, isLoading } = useAdminUsers();

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Usuarios del sistema</h2>
        <p className="text-[13px] text-text-2">Gestión de roles y acceso institucional</p>
      </div>

      <div className="flex justify-end mb-4">
        <Button size="sm">+ Nuevo usuario</Button>
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
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm">
                      Desactivar
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}
