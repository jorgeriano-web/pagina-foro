/** Configuración de salas / cupos (alinear con `back/functions/.../salaExperiencia.ts`). */

export interface SalaExperiencia {
  id: number;
  nombre: string;
  capacidadTotal: number;
  cuposReservados: number;
}

export const SALAS_EXPERIENCIA: SalaExperiencia[] = [
  {
    id: 1,
    nombre: 'Implementación de IA para tu Inmobiliaria',
    capacidadTotal: 30,
    cuposReservados: 0,
  },
  {
    id: 2,
    nombre: 'Entorno Juridico',
    capacidadTotal: 40,
    cuposReservados: 0,
  },
  {
    id: 3,
    nombre: 'Casos de Exito',
    capacidadTotal: 45,
    cuposReservados: 0,
  },
  {
    id: 4,
    nombre: 'Meet & Greet',
    capacidadTotal: 50,
    cuposReservados: 0,
  },
];

export function salaPorIdSala(idSala: number): SalaExperiencia | undefined {
  return SALAS_EXPERIENCIA.find((s) => s.id === idSala);
}

export function capacidadSala(idSala: number): number {
  return salaPorIdSala(idSala)?.capacidadTotal ?? 0;
}
