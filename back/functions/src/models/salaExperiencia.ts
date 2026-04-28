/** Datos de una sala (estado que devuelve el back; cuposReservados es informativo si lo calculás en otro lado). */
export interface SalaExperiencia {
  /** Mismo número que `idSala` en reservas / Sheet (1, 2 o 4). */
  id: number;
  nombre: string;
  capacidadTotal: number;
  cuposReservados: number;
}

/** Configuración fija de salas activas (1, 2 y 4). Sala 3 descontinuada; 40 cupos por turno (fecha+hora) cada una. */
export const SALAS_EXPERIENCIA: SalaExperiencia[] = [
  {
    id: 1,
    nombre: "Implementación de IA para tu Inmobiliaria",
    capacidadTotal: 40,
    cuposReservados: 0,
  },
  {
    id: 2,
    nombre: "Entorno jurídico",
    capacidadTotal: 40,
    cuposReservados: 0,
  },
  {
    id: 4,
    nombre: "Meet & Greet",
    capacidadTotal: 40,
    cuposReservados: 0,
  },
];

/** Payload de `listarSalasExperienciaProd` (una sola fuente: `SALAS_EXPERIENCIA`). */
export interface SalaExperienciaPublica {
  id: number;
  nombre: string;
  capacidadTotal: number;
}

export function salasExperienciaParaCliente(): SalaExperienciaPublica[] {
  return SALAS_EXPERIENCIA.map(({ id, nombre, capacidadTotal }) => ({
    id,
    nombre,
    capacidadTotal,
  }));
}
