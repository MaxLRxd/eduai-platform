/**
 * Material de estudio de ejemplo para el seed: texto real y suficiente para que el tutor IA, el
 * resumen y los simulacros tengan de dónde responder en una demo (antes eran frases de relleno).
 */
export interface MaterialDemo {
  titulo: string;
  seccion: "teoria" | "practica";
  texto: string;
}

export const MATERIAL_DEMO: Record<string, MaterialDemo[]> = {
  "Programación II": [
    {
      titulo: "Introducción a la programación orientada a objetos",
      seccion: "teoria",
      texto: `La programación orientada a objetos (POO) organiza un programa como un conjunto de objetos que colaboran enviándose mensajes. Un objeto combina datos (atributos) y comportamiento (métodos). Una clase es el molde a partir del cual se crean objetos; cada objeto creado a partir de una clase se llama instancia.

Los cuatro pilares de la POO son: encapsulamiento, abstracción, herencia y polimorfismo. El encapsulamiento consiste en ocultar el estado interno de un objeto y exponer solo una interfaz pública; así se evita que otras partes del programa lo dejen en un estado inválido. La abstracción permite modelar solo lo relevante de un concepto del mundo real.

La herencia permite que una clase hija reutilice atributos y métodos de una clase padre y los extienda o redefina. El polimorfismo permite tratar objetos de distintas clases a través de una misma interfaz: al llamar al método calcularArea de una Figura, cada subclase (Círculo, Rectángulo) ejecuta su propia versión.

Una buena práctica es preferir la composición sobre la herencia cuando la relación entre clases no es realmente de tipo "es un". Un Auto "tiene un" Motor; no es un Motor. Los constructores inicializan el estado del objeto, y los modificadores de acceso (público, privado, protegido) controlan la visibilidad de sus miembros.`,
    },
    {
      titulo: "Estructuras de datos: listas, pilas y colas",
      seccion: "teoria",
      texto: `Una estructura de datos define cómo se almacenan y organizan los datos para operar sobre ellos de forma eficiente. La elección correcta depende de qué operaciones se hacen con más frecuencia.

Una lista enlazada está formada por nodos; cada nodo guarda un dato y una referencia al siguiente. Insertar o eliminar al principio cuesta O(1), pero acceder al elemento en la posición i cuesta O(n) porque hay que recorrer los nodos. Un arreglo, en cambio, permite acceso directo por índice en O(1) pero insertar en el medio obliga a desplazar elementos.

Una pila (stack) sigue la política LIFO: el último en entrar es el primero en salir. Sus operaciones básicas son push (apilar), pop (desapilar) y peek (mirar el tope). Se usa, por ejemplo, para deshacer acciones y para evaluar expresiones. Una cola (queue) sigue la política FIFO: el primero en entrar es el primero en salir, con las operaciones enqueue y dequeue. Se usa en colas de impresión y en la planificación de tareas.

Un árbol binario de búsqueda mantiene a la izquierda los valores menores y a la derecha los mayores, lo que permite buscar en O(log n) si el árbol está balanceado. Las tablas hash ofrecen búsqueda promedio en O(1) usando una función de hash para calcular la posición de cada clave.`,
    },
    {
      titulo: "Ejercicios: clases, herencia y colecciones",
      seccion: "practica",
      texto: `Ejercicio 1. Definí una clase CuentaBancaria con los atributos titular y saldo privados. Agregá los métodos depositar(monto) y retirar(monto). El retiro debe lanzar una excepción si el monto supera el saldo. Explicá qué principio de la POO se aplica al mantener el saldo privado.

Ejercicio 2. Creá una clase abstracta Figura con el método abstracto area(). Implementá las subclases Circulo y Rectangulo. Luego armá una lista de figuras y recorrela imprimiendo el área de cada una. ¿Qué concepto permite que la misma llamada produzca resultados distintos?

Ejercicio 3. Implementá una pila con una lista enlazada, con las operaciones push, pop y estaVacia. Usala para verificar si una expresión tiene los paréntesis balanceados, por ejemplo "((a+b)*c)".

Ejercicio 4. Dada una lista de alumnos con nombre y nota, ordenala por nota descendente y calculá el promedio del curso. Indicá la complejidad del algoritmo de ordenamiento que utilizaste.

Criterios de evaluación: correcta aplicación del encapsulamiento, uso adecuado de herencia y polimorfismo, manejo de errores, y claridad del código.`,
    },
  ],
  "Bases de Datos": [
    {
      titulo: "Modelo relacional y normalización",
      seccion: "teoria",
      texto: `El modelo relacional organiza los datos en tablas (relaciones) formadas por filas (tuplas) y columnas (atributos). Cada tabla tiene una clave primaria que identifica de forma única cada fila. Una clave foránea es un atributo que referencia la clave primaria de otra tabla y permite relacionar los datos manteniendo la integridad referencial.

Las relaciones entre entidades pueden ser uno a uno, uno a muchos o muchos a muchos. Las relaciones muchos a muchos se resuelven con una tabla intermedia que contiene las claves foráneas de ambas entidades; por ejemplo, la tabla Inscripcion relaciona Alumno con Materia.

La normalización reduce la redundancia y evita anomalías de inserción, actualización y borrado. La primera forma normal (1FN) exige valores atómicos, sin grupos repetidos. La segunda forma normal (2FN) exige además que cada atributo no clave dependa de toda la clave primaria, no solo de una parte. La tercera forma normal (3FN) exige que no existan dependencias transitivas: un atributo no clave no debe depender de otro atributo no clave.

Un diagrama entidad-relación (DER) representa entidades, atributos y relaciones antes de pasar al esquema físico. Las restricciones (NOT NULL, UNIQUE, CHECK) garantizan que los datos cumplan las reglas del negocio.`,
    },
    {
      titulo: "Consultas SQL: SELECT, JOIN y agregaciones",
      seccion: "teoria",
      texto: `SQL (Structured Query Language) permite definir, consultar y modificar datos. La sentencia SELECT recupera filas; con WHERE se filtran, con ORDER BY se ordenan y con LIMIT se acota la cantidad de resultados.

Un JOIN combina filas de dos tablas según una condición. INNER JOIN devuelve solo las filas que coinciden en ambas tablas. LEFT JOIN devuelve todas las filas de la tabla izquierda y los datos de la derecha cuando existen, o NULL si no hay coincidencia. Se usa, por ejemplo, para listar todos los alumnos aunque no tengan notas cargadas.

Las funciones de agregación (COUNT, SUM, AVG, MIN, MAX) resumen un conjunto de filas. GROUP BY agrupa las filas por una o más columnas y permite aplicar la agregación a cada grupo. La cláusula HAVING filtra grupos después de agregar, mientras que WHERE filtra filas antes de agregar. Ejemplo: SELECT materia_id, AVG(valor) FROM nota GROUP BY materia_id HAVING AVG(valor) >= 6.

Una transacción agrupa varias operaciones que deben cumplirse todas o ninguna, y respeta las propiedades ACID: atomicidad, consistencia, aislamiento y durabilidad. Los índices aceleran las búsquedas a costa de espacio y de un mayor costo en las escrituras.`,
    },
    {
      titulo: "Ejercicios: diseño y consultas",
      seccion: "practica",
      texto: `Ejercicio 1. Diseñá el modelo relacional de una biblioteca con las entidades Socio, Libro y Préstamo. Indicá claves primarias, claves foráneas y el tipo de cada relación. Llevá el modelo hasta la tercera forma normal y justificá cada paso.

Ejercicio 2. Dada la tabla Pedido(id, cliente, ciudad, codigo_postal, provincia), identificá las dependencias transitivas y descomponé la tabla para cumplir 3FN.

Ejercicio 3. Escribí consultas SQL para: (a) listar los alumnos con su promedio de notas, (b) mostrar las materias que no tienen ningún alumno inscripto usando LEFT JOIN, (c) obtener los tres alumnos con mejor promedio, (d) contar cuántas inasistencias tiene cada alumno y mostrar solo quienes superan 5.

Ejercicio 4. Explicá con un ejemplo qué problema evita una transacción al transferir dinero entre dos cuentas y cuál de las propiedades ACID garantiza que no se pierda el dinero.

Criterios de evaluación: normalización correcta, consultas que devuelven el resultado pedido, uso adecuado de JOIN y agregaciones.`,
    },
  ],
  "Redes de Computadoras": [
    {
      titulo: "Modelo OSI y TCP/IP",
      seccion: "teoria",
      texto: `El modelo OSI divide la comunicación en siete capas: física, enlace de datos, red, transporte, sesión, presentación y aplicación. Cada capa presta servicios a la superior y se apoya en la inferior. El modelo TCP/IP, el que se usa en Internet, simplifica esto en cuatro capas: acceso a la red, internet, transporte y aplicación.

La capa física transmite bits por el medio (cable, fibra, radio). La capa de enlace organiza los bits en tramas y usa direcciones MAC dentro de una red local; los switches trabajan en esta capa. La capa de red se encarga del direccionamiento lógico y del enrutamiento entre redes mediante direcciones IP; los routers trabajan aquí.

La capa de transporte ofrece comunicación entre procesos. TCP es orientado a la conexión, confiable, con control de flujo y de congestión; establece la conexión con el acuerdo de tres vías (SYN, SYN-ACK, ACK). UDP no establece conexión ni garantiza entrega, pero es más liviano y se usa en streaming, juegos y consultas DNS.

En la capa de aplicación están protocolos como HTTP y HTTPS para la web, DNS para traducir nombres de dominio a direcciones IP, SMTP para correo y DHCP para asignar direcciones IP automáticamente. Encapsulamiento es el proceso por el cual cada capa agrega su propio encabezado a los datos que recibe de la capa superior.`,
    },
    {
      titulo: "Direccionamiento IPv4 y subnetting",
      seccion: "teoria",
      texto: `Una dirección IPv4 tiene 32 bits, que se escriben como cuatro números decimales de 0 a 255 separados por puntos. Una parte identifica la red y la otra el host. La máscara de subred indica cuántos bits corresponden a la red; la notación CIDR la expresa como un prefijo, por ejemplo /24 equivale a la máscara 255.255.255.0.

En una red con prefijo /n quedan 32 - n bits para hosts. La cantidad de direcciones es 2 elevado a (32 - n), y las direcciones utilizables son esa cantidad menos 2, porque la primera es la dirección de red y la última es la de broadcast. Por ejemplo, una red /24 tiene 256 direcciones y 254 hosts utilizables; una red /26 tiene 64 direcciones y 62 utilizables.

El subnetting divide una red en subredes más pequeñas tomando bits prestados de la parte de host. Si a la red 192.168.10.0/24 se le prestan 2 bits, se obtienen 4 subredes /26: 192.168.10.0, 192.168.10.64, 192.168.10.128 y 192.168.10.192, cada una con 62 hosts.

Las direcciones privadas (RFC 1918) son 10.0.0.0/8, 172.16.0.0/12 y 192.168.0.0/16; no se enrutan en Internet y requieren NAT para salir. El gateway predeterminado es el router al que un host envía el tráfico destinado a otras redes.`,
    },
    {
      titulo: "Ejercicios: subnetting y protocolos",
      seccion: "practica",
      texto: `Ejercicio 1. Dada la red 192.168.1.0/24, dividila en 4 subredes de igual tamaño. Para cada una indicá la máscara, la dirección de red, el rango de hosts utilizables y la dirección de broadcast.

Ejercicio 2. Una empresa necesita 50 hosts en una sucursal. ¿Cuál es el prefijo más largo (máscara más chica) que alcanza? Justificá el cálculo de hosts utilizables.

Ejercicio 3. Explicá paso a paso qué ocurre, capa por capa, cuando un usuario escribe una dirección web en el navegador: resolución DNS, establecimiento de la conexión TCP y envío de la solicitud HTTP.

Ejercicio 4. Compará TCP y UDP: indicá en qué casos elegirías cada uno y por qué. Explicá el acuerdo de tres vías.

Ejercicio 5. Indicá si las direcciones 172.20.5.10, 172.32.0.1 y 10.255.255.254 son privadas o públicas.

Criterios de evaluación: cálculo correcto de subredes, claridad en la explicación de las capas y correcta justificación de las decisiones.`,
    },
  ],
};
