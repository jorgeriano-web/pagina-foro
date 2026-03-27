/** Datos de una sala (estado que devuelve el back; cuposReservados es informativo si lo calculás en otro lado). */
export interface SalaExperiencia {
  id: string;
  nombre: string;
  capacidadTotal: number;
  cuposReservados: number;
}
