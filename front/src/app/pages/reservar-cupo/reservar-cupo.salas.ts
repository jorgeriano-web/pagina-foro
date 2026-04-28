/**
 * Salas con reserva de cupo activa en el front (alineado con el back: 1, 2 y 4).
 */

export type IdSalaReserva = 1 | 2 | 4;

export function esIdSalaReserva(n: number): n is IdSalaReserva {
  return n === 1 || n === 2 || n === 4;
}
