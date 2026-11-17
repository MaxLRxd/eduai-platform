const MOJIBAKE = /[ÃÂâð][\u0080-\u00BF]/;

/**
 * multer/busboy decodifica `originalname` como latin1 cuando el navegador envía
 * el nombre en UTF-8: "Presentación" llega como "PresentaciÃ³n". Convertimos
 * solo cuando hay señales de mojibake para no romper nombres ya correctos.
 * El bucle cubre un doble encoding accidental sin afectar nombres válidos.
 */
export function nombreArchivoUtf8(nombre: string): string {
  let actual = nombre;

  for (let intento = 0; intento < 3 && MOJIBAKE.test(actual); intento += 1) {
    const decodificado = Buffer.from(actual, "latin1").toString("utf8");
    if (decodificado.includes("\uFFFD") || decodificado === actual) break;
    actual = decodificado;
  }

  return actual;
}
