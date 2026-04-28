/**
 * Validación local del UUID en la ruta antes de llamar al back (misma regla que `obtenerCupoPorUuidProd`).
 */
export const RX_UUID_V4_CUPO =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
