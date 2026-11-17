import { QueryClient } from "@tanstack/react-query";

/** Un único cliente de consultas para toda la app, para poder vaciarlo al cambiar de usuario. */
export const queryClient = new QueryClient();
