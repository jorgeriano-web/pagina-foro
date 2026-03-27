/** Datos de una sala (estado que devuelve el back; cuposReservados es informativo si lo calculás en otro lado). */
export interface SalaExperiencia {
  /** Mismo número que `idSala` en reservas / Sheet (1–4). */
  id: number;
  nombre: string;
  capacidadTotal: number;
  cuposReservados: number;
}

/** Configuración fija de las 4 salas. `cuposReservados` acá es 0 hasta que lo tomes del Sheet u otra fuente. */
export const SALAS_EXPERIENCIA: SalaExperiencia[] = [
  {
    id: 1,
    nombre: "Implementación de IA para tu Inmobiliaria",
    capacidadTotal: 30,
    cuposReservados: 0,
  },
  {
    id: 2,
    nombre: "Entorno Juridico",
    capacidadTotal: 40,
    cuposReservados: 0,
  },
  {
    id: 3,
    nombre: "Casos de Exito",
    capacidadTotal: 45,
    cuposReservados: 0,
  },
  {
    id: 4,
    nombre: "Meet & Greet",
    capacidadTotal: 50,
    cuposReservados: 0,
  },
];
