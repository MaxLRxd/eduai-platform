-- CU-AD02 / CU-AD03: avisos in-app generados por el sistema (asignacion de docentes, alta de cuentas, baja de matricula).
ALTER TYPE "TipoNotificacion" ADD VALUE IF NOT EXISTS 'SISTEMA';
