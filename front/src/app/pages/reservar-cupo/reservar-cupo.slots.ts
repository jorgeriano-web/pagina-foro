/**
 * Turnos fijos de charlas (valor `fecha|hora` alineado con el back).
 * Aislado del componente para un solo lugar de edición cuando cambien fechas u horarios.
 */

/** Valor del `<select>`: `fecha|hora` en formato acordado con el back. */
export interface OpcionSlotCharla {
  value: string;
  label: string;
}

/** Una fila del `<select>` (texto, valor, si está llena). */
export interface OpcionSlotSelect {
  value: string;
  label: string;
  disabled: boolean;
}

export const RX_FECHA_YMD = /^\d{4}-\d{2}-\d{2}$/;
export const RX_HORA_HM = /^\d{1,2}:\d{2}$/;

/** Foro 2026: primera y segunda jornada (alineado con `SLOTS_CHARLA`). */
export const FORO_FECHA_DIA_1 = '2026-05-21';
export const FORO_FECHA_DIA_2 = '2026-05-22';

export const SLOTS_CHARLA: readonly OpcionSlotCharla[] = [
  { value: '2026-05-21|14:30', label: '21 de mayo, 2:30 p. m. (Grupo 1)' },
  { value: '2026-05-21|15:00', label: '21 de mayo, 3:00 p. m. (Grupo 2)' },
  { value: '2026-05-22|10:30', label: '22 de mayo, 10:30 a. m. (Grupo 1)' },
  { value: '2026-05-22|11:00', label: '22 de mayo, 11:00 a. m. (Grupo 2)' },
  { value: '2026-05-22|14:00', label: '22 de mayo, 2:00 p. m. (Grupo 1)' },
  { value: '2026-05-22|14:30', label: '22 de mayo, 2:30 p. m. (Grupo 2)' },
];

/** Interpreta el `value` del slot (`fecha|horaCharla`). */
export function parseSlotCharlaValue(
  value: string,
): { fecha: string; horaCharla: string } | null {
  if (!value) {
    return null;
  }
  const partes = value.split('|');
  const fecha = partes[0] ?? '';
  const horaCharla = (partes[1] ?? '').trim();
  if (!RX_FECHA_YMD.test(fecha) || !RX_HORA_HM.test(horaCharla)) {
    return null;
  }
  return { fecha, horaCharla };
}

/** Si `fechasPermitidas` tiene fechas válidas, solo esos turnos; si no, todos los `SLOTS_CHARLA`. */
export function slotsCharlaFiltradosPorFechas(
  fechasPermitidas: readonly string[] | null | undefined,
): readonly OpcionSlotCharla[] {
  if (fechasPermitidas == null || fechasPermitidas.length === 0) {
    return SLOTS_CHARLA;
  }
  const permitidas = new Set(
    fechasPermitidas
      .map((f) => f.trim())
      .filter((f) => RX_FECHA_YMD.test(f)),
  );
  if (permitidas.size === 0) {
    return SLOTS_CHARLA;
  }
  return SLOTS_CHARLA.filter((s) => {
    const p = parseSlotCharlaValue(s.value);
    return p != null && permitidas.has(p.fecha);
  });
}
