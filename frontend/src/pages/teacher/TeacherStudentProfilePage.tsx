import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";

export function TeacherStudentProfilePage(): React.ReactElement {
  const { legajo } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Perfil del alumno</h2>
          <p className="text-[13px] text-text-2">Legajo: {legajo}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>
      <Card>
        <CardHeader title="Información del alumno" />
        <p className="text-sm text-text-2">Información no disponible temporalmente.</p>
      </Card>
    </div>
  );
}
