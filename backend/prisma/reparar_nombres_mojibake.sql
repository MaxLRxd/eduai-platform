-- Reparación manual de nombres de archivo guardados con mojibake (latin1 leído como UTF-8).
-- NO se ejecuta como migración automática. Hacer backup antes de descomentar los UPDATE.
--
-- Uso:
--   1. Ejecutar los SELECT de diagnóstico y revisar los resultados.
--   2. Si el resultado "corregido" es el nombre esperado, hacer backup.
--   3. Descomentar el bloque BEGIN/UPDATE/COMMIT y ejecutarlo en la misma transacción.
--
-- La conversión solo afecta filas con marcas de mojibake ("Ã", "Â"); las filas
-- que ya están bien guardadas no se tocan.

-- Diagnóstico: contenidos
SELECT id, titulo, archivo_nombre,
       convert_from(convert_to(titulo, 'LATIN1'), 'UTF8') AS titulo_corregido,
       convert_from(convert_to(archivo_nombre, 'LATIN1'), 'UTF8') AS nombre_corregido
FROM contenidos
WHERE titulo ~ '[ÃÂ]' OR archivo_nombre ~ '[ÃÂ]';

-- Diagnóstico: entregas
SELECT id, archivo_nombre,
       convert_from(convert_to(archivo_nombre, 'LATIN1'), 'UTF8') AS nombre_corregido
FROM entregas
WHERE archivo_nombre ~ '[ÃÂ]';

-- Diagnóstico: material de planning
SELECT id, material_nombre,
       convert_from(convert_to(material_nombre, 'LATIN1'), 'UTF8') AS nombre_corregido
FROM planning_clases
WHERE material_nombre ~ '[ÃÂ]';

-- Reparación (descomentar después del backup)
-- BEGIN;
--
-- UPDATE contenidos
-- SET titulo = convert_from(convert_to(titulo, 'LATIN1'), 'UTF8')
-- WHERE titulo ~ '[ÃÂ]';
--
-- UPDATE contenidos
-- SET archivo_nombre = convert_from(convert_to(archivo_nombre, 'LATIN1'), 'UTF8')
-- WHERE archivo_nombre ~ '[ÃÂ]';
--
-- UPDATE entregas
-- SET archivo_nombre = convert_from(convert_to(archivo_nombre, 'LATIN1'), 'UTF8')
-- WHERE archivo_nombre ~ '[ÃÂ]';
--
-- UPDATE planning_clases
-- SET material_nombre = convert_from(convert_to(material_nombre, 'LATIN1'), 'UTF8')
-- WHERE material_nombre ~ '[ÃÂ]';
--
-- COMMIT;
