import type { InboxMessage } from "../../types/domain";

export const MOCK_INBOX: InboxMessage[] = [
  { id: "1", from: "Cardozo, Juan", subject: "Dudas sobre el TP3", when: "Hace 30 min", unread: true },
  { id: "2", from: "Báez, María", subject: "Consulta sobre el parcial", when: "Hace 2 h", unread: true },
  { id: "3", from: "Díaz, Lucas", subject: "Pedido de prórroga", when: "Hace 4 h", unread: false },
  { id: "4", from: "Espinoza, Ana", subject: "Gracias por la corrección", when: "Ayer", unread: false },
  { id: "5", from: "Acevedo, Lautaro", subject: "Consulta sobre método equals()", when: "Ayer", unread: false },
];
