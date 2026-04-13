/**
 * Forma de la respuesta de `listarSalasExperienciaProd`.
 * Los valores reales viven solo en el back (`models/salaExperiencia.ts`).
 */

export interface SalaExperienciaPublica {
  id: number;
  nombre: string;
  capacidadTotal: number;
}
