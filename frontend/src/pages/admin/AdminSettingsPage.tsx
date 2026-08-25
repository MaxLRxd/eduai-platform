import React, { useState } from "react";
import { useAdminSettings, useSaveBranding } from "../../hooks/useAdminSettings";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function AdminSettingsPage(): React.ReactElement {
  const { presets, institutionName } = useAdminSettings();
  const saveBranding = useSaveBranding();

  const [name, setName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("p-blue");
  const [primary, setPrimary] = useState("#003d7a");
  const [secondary, setSecondary] = useState("#005fa3");
  const [lighter, setLighter] = useState("#dbeafe");

  React.useEffect(() => {
    if (institutionName.data) setName(institutionName.data);
  }, [institutionName.data]);

  const applyPreset = (id: string): void => {
    const preset = presets.data?.find((p) => p.id === id);
    if (!preset) return;
    setSelectedPreset(id);
    setPrimary(preset.primary);
    setSecondary(preset.secondary);
    setLighter(preset.lighter);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Apariencia institucional</h2>
        <p className="text-[13px] text-text-2">Personalizá colores, nombre e identidad visual de la plataforma</p>
      </div>

      <Card className="mb-5">
        <CardHeader title="🏫 Identidad institucional" />
        <div className="flex gap-5 items-start flex-wrap">
          <div className="w-[72px] h-[72px] rounded-lg border-2 border-dashed border-border-strong flex items-center justify-center text-2xl bg-surface-2 shrink-0">
            🏫
          </div>
          <div className="flex-1 min-w-[240px] flex flex-col gap-2.5">
            <div>
              <label htmlFor="inst-name" className="block text-xs font-semibold text-text-1 mb-1.5">
                Nombre de la institución
              </label>
              <input
                id="inst-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: IES Santa Fe"
                className="w-full px-3 py-2 border border-border rounded text-sm"
              />
            </div>
            <div>
              <label htmlFor="inst-logo" className="block text-xs font-semibold text-text-1 mb-1.5">
                Escudo o logo
              </label>
              <input id="inst-logo" type="file" accept="image/*" className="w-full text-sm" />
            </div>
            <div>
              <Button variant="secondary" size="sm">
                Quitar logo
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-5">
        <CardHeader title="🎨 Esquemas preconfigurados" />
        <p className="text-xs text-text-2 mb-4">Seleccioná un esquema base para tu institución. Podés ajustarlo manualmente a continuación.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5" role="radiogroup" aria-label="Esquemas de color">
          {(presets.data ?? []).map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              aria-pressed={selectedPreset === p.id}
              className={`relative border-[1.5px] rounded p-2.5 text-center transition-all ${
                selectedPreset === p.id ? "border-primary ring-2 ring-primary-light" : "border-border hover:border-border-strong"
              }`}
            >
              {selectedPreset === p.id && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-white text-[9px]">✓</span>
              )}
              <div className="w-full h-7 rounded mb-2" style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})` }} />
              <div className="text-[10px] font-bold text-text-1">{p.name}</div>
              <div className="text-[10px] text-text-3">{p.inst}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-5">
        <CardHeader title="✏️ Ajuste manual de colores" />
        <div className="grid md:grid-cols-3 gap-3 mb-5">
          {[
            { key: "primary", label: "Color primario (sidebar, títulos)", value: primary, setter: setPrimary },
            { key: "secondary", label: "Color secundario (gradientes)", value: secondary, setter: setSecondary },
            { key: "lighter", label: "Fondo activo (items seleccionados)", value: lighter, setter: setLighter },
          ].map((c) => (
            <div key={c.key} className="flex flex-col gap-1.5">
              <label htmlFor={`color-${c.key}`} className="text-xs font-semibold text-text-1">
                {c.label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`color-${c.key}`}
                  type="color"
                  value={c.value}
                  onChange={(e) => c.setter(e.target.value)}
                  className="w-11 h-8.5 border border-border rounded-sm cursor-pointer bg-white"
                />
                <input
                  value={c.value}
                  onChange={(e) => c.setter(e.target.value)}
                  maxLength={7}
                  className="flex-1 px-2.5 py-1.5 border border-border rounded-sm text-xs font-mono"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-text-2 font-semibold mb-2">Vista previa</div>
        <div className="border-[1.5px] border-border rounded-lg overflow-hidden">
          <div className="h-9.5 flex items-center gap-2 px-3.5 text-white text-xs font-semibold" style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
            EduAI — {name || "Institución"}
          </div>
          <div className="p-3 bg-surface-2 flex gap-2 items-center flex-wrap">
            <button className="px-3.5 py-1.5 rounded text-xs font-semibold text-white cursor-default" style={{ background: primary }}>
              Botón primario
            </button>
            <button className="px-3.5 py-1.5 rounded text-xs font-semibold border-2 bg-transparent cursor-default" style={{ borderColor: primary, color: primary }}>
              Botón outline
            </button>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ background: primary }}>
              Etiqueta
            </span>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2">
        <Button onClick={() => saveBranding.mutate()} disabled={saveBranding.isPending}>
          {saveBranding.isPending ? "Aplicando…" : "Aplicar apariencia"}
        </Button>
        <Button variant="secondary" onClick={() => applyPreset("p-blue")}>
          Restaurar por defecto
        </Button>
        {saveBranding.isSuccess && <span className="text-xs text-success">✅ Apariencia guardada</span>}
      </div>
    </div>
  );
}
