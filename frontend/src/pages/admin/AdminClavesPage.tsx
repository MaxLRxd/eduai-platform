import React, { useState } from "react";
import { useAdminSubjects } from "../../hooks/useAdminSubjects";
import { useAdminKeys, useGenerateAdminKey } from "../../hooks/useAdminKeys";
import { Card, CardHeader } from "../../components/ui/Card";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import { Tag } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";

export function AdminClavesPage(): React.ReactElement {
  const { data: subjects } = useAdminSubjects();
  const { data: keys, isLoading } = useAdminKeys();
  const generate = useGenerateAdminKey();

  const [materiaFilter, setMateriaFilter] = useState("");
  const [newKeyMateria, setNewKeyMateria] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [maxUsos, setMaxUsos] = useState("");
  const [message, setMessage] = useState("");
  const [inscriptosModal, setInscriptosModal] = useState<{ codigo: string; names: string[] } | null>(null);

  const activeSubjects = (subjects ?? []).filter((s) => s.estado === "Activa");
  const filteredKeys = (keys ?? []).filter((k) => !materiaFilter || k.materiaId === materiaFilter);

  const handleGenerate = (): void => {
    const materia = activeSubjects.find((s) => s.id === newKeyMateria);
    if (!materia) {
      setMessage("Seleccioná una materia para generar la clave.");
      return;
    }
    generate.mutate(
      { materiaId: materia.id, materiaNombre: materia.nombre, vencimiento: vencimiento || null, maxUsos: maxUsos ? Number(maxUsos) : null },
      {
        onSuccess: (key) => {
          setMessage(`✅ Clave "${key.codigo}" generada para ${materia.nombre}.`);
          setNewKeyMateria("");
          setVencimiento("");
          setMaxUsos("");
        },
      }
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Claves de Matriculación</h2>
        <p className="text-[13px] text-text-2">Generá, consultá y revocá claves de matriculación para controlar el acceso de alumnos a cada materia.</p>
      </div>

      <div className="grid xl:grid-cols-[2fr_1fr] gap-5">
        <div>
          <div className="bg-surface border border-border rounded-lg px-4.5 py-3.5 mb-4 shadow-xs flex items-center gap-2 flex-wrap">
            <label htmlFor="claves-materia" className="text-xs font-bold text-text-2">
              📚 Materia:
            </label>
            <select
              id="claves-materia"
              value={materiaFilter}
              onChange={(e) => setMateriaFilter(e.target.value)}
              className="min-w-[220px] px-2.5 py-1.5 border border-border rounded text-[13px] bg-surface"
            >
              <option value="">— Todas las materias —</option>
              {(subjects ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          {isLoading && <p className="text-sm text-text-2">Cargando claves…</p>}

          <TableWrap>
            <Table>
              <Thead>
                <tr>
                  <Th>Código</Th>
                  <Th>Materia</Th>
                  <Th>Estado</Th>
                  <Th>Vencimiento</Th>
                  <Th>Usos</Th>
                  <Th>Acciones</Th>
                </tr>
              </Thead>
              <tbody>
                {filteredKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-surface-2">
                    <Td className="font-mono text-xs font-bold">{k.codigo}</Td>
                    <Td>{k.materiaNombre}</Td>
                    <Td>
                      <Tag color={k.estado === "activa" ? "green" : "red"}>{k.estado === "activa" ? "Activa" : "Revocada"}</Tag>
                    </Td>
                    <Td className="text-xs">{k.vencimiento ?? "Sin vencimiento"}</Td>
                    <Td className="text-xs">
                      {k.usos} / {k.maxUsos ?? "∞"}
                    </Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => setInscriptosModal({ codigo: k.codigo, names: k.inscriptos })}>
                          Ver inscriptos
                        </Button>
                        {k.estado === "activa" && (
                          <Button variant="ghost" size="sm">
                            Revocar
                          </Button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </div>

        <Card className="self-start">
          <CardHeader title="➕ Generar nueva clave" />
          <div className="mb-3.5">
            <label htmlFor="nueva-clave-materia" className="block text-xs font-semibold text-text-1 mb-1.5">
              Materia
            </label>
            <select
              id="nueva-clave-materia"
              value={newKeyMateria}
              onChange={(e) => setNewKeyMateria(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
            >
              <option value="">— Seleccioná una materia —</option>
              {activeSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3.5">
            <label htmlFor="nueva-clave-vencimiento" className="block text-xs font-semibold text-text-1 mb-1.5">
              Fecha de vencimiento <span className="text-text-3 font-normal">(opcional)</span>
            </label>
            <input
              id="nueva-clave-vencimiento"
              type="date"
              value={vencimiento}
              onChange={(e) => setVencimiento(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
          </div>
          <div className="mb-3.5">
            <label htmlFor="nueva-clave-maxusos" className="block text-xs font-semibold text-text-1 mb-1.5">
              Cantidad máxima de usos <span className="text-text-3 font-normal">(opcional)</span>
            </label>
            <input
              id="nueva-clave-maxusos"
              type="number"
              min={1}
              value={maxUsos}
              onChange={(e) => setMaxUsos(e.target.value)}
              placeholder="Sin límite"
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
          </div>
          <Button fullWidth className="justify-center" onClick={handleGenerate} disabled={generate.isPending}>
            {generate.isPending ? "Generando…" : "Generar clave"}
          </Button>
          {message && <p className="text-xs text-text-2 mt-2.5">{message}</p>}
        </Card>
      </div>

      <Modal open={inscriptosModal !== null} onClose={() => setInscriptosModal(null)} title={`Inscriptos con ${inscriptosModal?.codigo}`}>
        {inscriptosModal && inscriptosModal.names.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {inscriptosModal.names.map((n) => (
              <li key={n} className="text-sm text-text-1">
                {n}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-2">Todavía no hay alumnos inscriptos con esta clave.</p>
        )}
      </Modal>
    </div>
  );
}
