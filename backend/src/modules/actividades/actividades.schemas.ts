import { validarDescriptores } from "./rubricas";
import { z } from "zod";

export const tipoActividadSchema = z.enum(["MULTIPLE_CHOICE", "DESARROLLO", "ARCHIVO", "CODIGO"]);

export const opcionMcSchema = z.object({
  texto: z.string().min(1),
  correcta: z.boolean(),
});

export const crearActividadSchema = z.object({
  seccion_id: z.string().uuid(),
  clase_id: z.string().uuid().nullable().optional(),
  // `null` desvincula la rubrica: si no, no habria forma de sacarle una rubrica
  // a una actividad y la rubrica quedaria bloqueada para siempre.
  rubrica_id: z.string().uuid().nullable().optional(),
  nombre: z.string().min(1).max(200),
  consigna: z.string().min(1),
  tipo: tipoActividadSchema,
  opciones_mc: z.array(opcionMcSchema).optional(),
  formatos_permitidos: z.string().max(100).nullish(),
  fecha_limite: z.coerce.date(),
  correccion_manual: z.boolean().default(false),
});

export const actualizarActividadSchema = crearActividadSchema.partial().extend({
  // Archivar en vez de borrar: se oculta de la lista del alumno y conserva las entregas.
  activo: z.boolean().optional(),
});

export const enviarEntregaSchema = z
  .object({
    respuesta_texto: z.string().min(1).optional(),
    respuesta_codigo: z.string().min(1).optional(),
    archivo_url: z.string().min(1).optional(),
    archivo_nombre: z.string().max(255).optional(),
  })
  .refine((d) => d.respuesta_texto || d.respuesta_codigo || d.archivo_url, {
    message: "La entrega debe incluir una respuesta en texto/codigo o un archivo",
  });

export const corregirEntregaSchema = z.object({
  calificacion_final: z.number().min(0).max(10, "La calificacion debe estar entre 0 y 10"),
  feedback_final: z.string().min(1),
  revision_tipo: z.enum(["IA", "MANUAL"]).optional(),
});

// `esperado` es lo que le dice a la IA qué tiene que encontrar en la entrega. Sin el,
// la rúbrica solo pesa criterios y el modelo corrige a ciegas.
export const criterioRubricaSchema = z.object({
  nombre: z.string().trim().min(1, "El criterio necesita un nombre"),
  peso: z.number().min(0).max(100),
  esperado: z.string().trim().min(1, "El criterio necesita describir lo esperado"),
  // CU-P04: que se ve en la entrega para cada nivel (clave = nombre del nivel). Opcional.
  descriptores: z.record(z.string(), z.string().trim().max(500, "El descriptor es muy largo (maximo 500 caracteres)")).optional(),
});

// CU-P04: niveles de desempeno (Excelente, Bueno...). `puntaje` es el % del peso del criterio que
// se obtiene en ese nivel. Van de mejor a peor y el mejor vale 100, para que 10 sea alcanzable.
export const nivelDesempenoSchema = z.object({
  nombre: z.string().trim().min(1, "Cada nivel necesita un nombre").max(40, "El nombre del nivel es muy largo"),
  puntaje: z.number().min(0, "El puntaje no puede ser negativo").max(100, "El puntaje no puede superar 100"),
});

export const nivelesSchema = z
  .array(nivelDesempenoSchema)
  .min(2, "Defini al menos 2 niveles")
  .max(6, "Maximo 6 niveles")
  .superRefine((niveles, ctx) => {
    const nombres = niveles.map((n) => n.nombre.toLowerCase());
    if (new Set(nombres).size !== nombres.length) {
      ctx.addIssue({ code: "custom", message: "Hay niveles con el mismo nombre" });
    }
    if (niveles[0] && niveles[0].puntaje !== 100) {
      ctx.addIssue({ code: "custom", message: "El mejor nivel (el primero) tiene que valer 100%" });
    }
    for (let i = 1; i < niveles.length; i++) {
      if (niveles[i].puntaje >= niveles[i - 1].puntaje) {
        ctx.addIssue({ code: "custom", message: "Los niveles van de mejor a peor: cada puntaje debe ser menor al anterior" });
        break;
      }
    }
  });

const criteriosSchema = z
  .array(criterioRubricaSchema)
  .min(1, "La rubrica debe tener al menos un criterio")
  .refine(
    (criterios) => Math.abs(criterios.reduce((total, c) => total + c.peso, 0) - 100) < 0.01,
    { message: "Los pesos de los criterios deben sumar 100" }
  );

const rubricaBase = z.object({
  nombre: z.string().trim().min(1).max(200),
  descripcion: z.string().trim().optional(),
  criterios: criteriosSchema,
});

export const crearRubricaSchema = rubricaBase.extend({ niveles: nivelesSchema.optional() }).superRefine((r, ctx) => {
  try {
    validarDescriptores(r.criterios, r.niveles ?? null);
  } catch (e) {
    ctx.addIssue({ code: "custom", message: (e as Error).message, path: ["criterios"] });
  }
});

// En la edicion `niveles: null` quita los niveles de la rubrica. Si solo llega una de las dos partes,
// el servicio revisa la consistencia contra lo que ya estaba guardado.
export const actualizarRubricaSchema = rubricaBase
  .extend({ niveles: nivelesSchema.nullable() })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "No se envio ningun campo para actualizar" });

export type CrearActividadInput = z.infer<typeof crearActividadSchema>;
export type ActualizarActividadInput = z.infer<typeof actualizarActividadSchema>;
export type EnviarEntregaInput = z.infer<typeof enviarEntregaSchema>;
export type CorregirEntregaInput = z.infer<typeof corregirEntregaSchema>;
export type CrearRubricaInput = z.infer<typeof crearRubricaSchema>;
export type ActualizarRubricaInput = z.infer<typeof actualizarRubricaSchema>;