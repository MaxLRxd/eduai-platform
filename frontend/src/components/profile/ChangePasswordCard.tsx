import React, { useState } from "react";
import { Card, CardHeader } from "../ui/Card";
import { FormField } from "../ui/FormField";
import { Button } from "../ui/Button";
import { InfoBox } from "../ui/InfoBox";
import { apiErrorMessage } from "../../services/api";
import { changePasswordRequest } from "../../services/auth.service";

const MIN_LENGTH = 8;

export function ChangePasswordCard(): React.ReactElement {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setDone(false);

    if (next.length < MIN_LENGTH) {
      setError(`La nueva contraseña debe tener al menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    if (next !== confirm) {
      setError("La confirmación no coincide con la nueva contraseña.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await changePasswordRequest(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo cambiar la contraseña."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Seguridad" />
      <form onSubmit={(e) => void handleSubmit(e)}>
        <InfoBox variant="info">
          Usá al menos {MIN_LENGTH} caracteres. Al cambiarla se cierran tus sesiones en otros dispositivos.
        </InfoBox>
        <FormField
          id="current-password"
          label="Contraseña actual"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
        <FormField
          id="new-password"
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
        <FormField
          id="confirm-password"
          label="Confirmar nueva contraseña"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {error && <InfoBox variant="error">{error}</InfoBox>}
        {done && <InfoBox variant="success">✅ Contraseña actualizada.</InfoBox>}
        <Button type="submit" variant="secondary" size="sm" disabled={saving || !current || !next || !confirm}>
          {saving ? "Guardando…" : "Cambiar contraseña"}
        </Button>
      </form>
    </Card>
  );
}
