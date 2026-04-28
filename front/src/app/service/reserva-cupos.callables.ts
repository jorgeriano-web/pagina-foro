/**
 * Nombres de las Cloud Functions (callables) del dominio cupos.
 * Deben coincidir con las exportaciones en `back/functions` (mismo string).
 */
export const CF_CUPO = {
  listarSalas: 'listarSalasExperienciaProd',
  contarReservas: 'contarReservasSalaProd',
  obtenerPorUuid: 'obtenerCupoPorUuidProd',
  reservar: 'reservarCupoSalaProd',
} as const;
