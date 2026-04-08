import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  Optional,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { capacidadSala } from '../../models/sala-experiencia';
import { ReservaCupos } from '../../service/reserva-cupos';

/** Datos que envía la landing al abrir el MatDialog. */
export interface ReservaCupoDialogData {
  idSala: number;
  nombreExperiencia: string;
}

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

const RX_FECHA_YMD = /^\d{4}-\d{2}-\d{2}$/;
const RX_HORA_HM = /^\d{1,2}:\d{2}$/;

@Component({
  selector: 'app-reservar-cupo',
  imports: [CommonModule, FormsModule],
  templateUrl: './reservar-cupo.html',
  styleUrl: './reservar-cupo.css',
  standalone: true,
})
export class ReservarCupo implements OnInit {
  // ——— Formulario ———
  nombre = '';
  numDoc = '';
  correo = '';
  slotSeleccionado = '';

  readonly slotsCharla: OpcionSlotCharla[] = [
    { value: '2026-05-21|14:30', label: '21 de mayo, 2:30 p. m.' },
    { value: '2026-05-21|16:45', label: '21 de mayo, 4:45 p. m.' },
    { value: '2026-05-22|14:30', label: '22 de mayo, 2:30 p. m.' },
    { value: '2026-05-22|16:45', label: '22 de mayo, 4:45 p. m.' },
  ];

  // ——— Estado UI ———
  procesando = false;
  reservaExitosa = false;
  errorReserva: string | null = null;
  /** Reservas para el turno elegido; null = sin turno o cargando/error. */
  reservasActuales: number | null = null;

  /** Conteo por `value` del slot (`fecha|hora`). `null` = falló la consulta. */
  conteosPorSlot: Record<string, number | null> = {};

  /** Mientras carga el conteo de todos los turnos (hay sala válida). */
  cargandoConteosSlots = false;

  private refreshTodosSeq = 0;
  private pedidoConteoSeq = 0;

  constructor(
    @Optional() private dialogRef: MatDialogRef<ReservarCupo> | null,
    @Optional() @Inject(MAT_DIALOG_DATA) private data: ReservaCupoDialogData | null,
    @Optional() private route: ActivatedRoute | null,
    private reservaCuposService: ReservaCupos,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.refrescarConteosTodosSlots();
  }

  // ——— Vista: getters ———

  get esDialogo(): boolean {
    return this.dialogRef != null;
  }

  get idSala(): number | null {
    if (this.data?.idSala != null) {
      return this.data.idSala;
    }
    const s = this.route?.snapshot.queryParamMap.get('sala');
    const n = s ? Number.parseInt(s, 10) : NaN;
    return !Number.isNaN(n) && n >= 1 && n <= 4 ? n : null;
  }

  get nombreExperiencia(): string {
    if (this.data?.nombreExperiencia) {
      return this.data.nombreExperiencia;
    }
    return this.route?.snapshot.queryParamMap.get('titulo') ?? '';
  }

  get capacidadMax(): number {
    const id = this.idSala;
    return id == null ? 0 : capacidadSala(id);
  }

  get opcionesSlotSelect(): OpcionSlotSelect[] {
    const id = this.idSala;
    const max = this.capacidadMax;
    return this.slotsCharla.map((s) => {
      if (id == null || max <= 0) {
        return { value: s.value, label: s.label, disabled: false };
      }
      if (this.cargandoConteosSlots) {
        return { value: s.value, label: s.label, disabled: true };
      }
      const n = this.conteosPorSlot[s.value];
      if (n === null || n === undefined) {
        return { value: s.value, label: s.label, disabled: false };
      }
      const lleno = n >= max;
      return {
        value: s.value,
        label: lleno ? `${s.label} — Cupos agotados` : s.label,
        disabled: lleno,
      };
    });
  }

  get textoCuposDialogo(): string {
    const max = this.capacidadMax;
    if (max <= 0) {
      return '';
    }
    if (!this.slotSeleccionado) {
      return 'Elegí fecha y hora para ver cupos de ese turno.';
    }
    const n = this.reservasActuales;
    if (n === null) {
      return 'Consultando cupos…';
    }
    const quedan = Math.max(0, max - n);
    return `Este turno: ${n} de ${max} reservas. Quedan ${quedan} cupo${quedan === 1 ? '' : 's'}.`;
  }

  trackBySlotValue(_index: number, o: OpcionSlotSelect): string {
    return o.value;
  }

  // ——— Acciones template ———

  onSlotChange(): void {
    this.sincronizarReservasActualesDesdeMap();
    this.actualizarConteoSlot();
  }

  cerrarDialogo(): void {
    this.dialogRef?.close();
  }

  cerrarTrasExito(): void {
    this.dialogRef?.close({ ok: true });
  }

  async reservaCupo(): Promise<void> {
    const idSala = this.idSala;
    if (idSala == null || this.procesando || this.reservaExitosa) {
      return;
    }

    const nombre = this.nombre.trim();
    const numDoc = this.numDoc.trim();
    const correo = this.correo.trim();

    if (!this.slotSeleccionado) {
      this.errorReserva = 'Elegí la fecha y hora de la charla.';
      return;
    }
    if (!nombre || !numDoc || !correo) {
      this.errorReserva = 'Completa nombre, cédula y correo.';
      return;
    }

    const slot = this.parseSlotSeleccionado();
    if (slot == null) {
      this.errorReserva = 'Elegí una fecha y hora válidas.';
      return;
    }

    this.errorReserva = null;
    this.procesando = true;
    this.cdr.detectChanges();

    try {
      await this.reservaCuposService.reservaSalaCupo({
        idSala,
        fecha: slot.fecha,
        horaCharla: slot.horaCharla,
        nombre,
        numDoc,
        correo,
      });
      this.reservaExitosa = true;
      this.refrescarConteosTodosSlots();
    } catch (e: unknown) {
      this.errorReserva = this.mensajeErrorReserva(e);
      this.refrescarConteosTodosSlots();
    } finally {
      this.procesando = false;
      this.cdr.detectChanges();
    }
  }

  // ——— Internos ———

  private refrescarConteosTodosSlots(): void {
    const id = this.idSala;
    const max = this.capacidadMax;

    if (id == null || max <= 0) {
      this.refreshTodosSeq++;
      this.cargandoConteosSlots = false;
      this.conteosPorSlot = {};
      this.limpiarSeleccionSiAgotado();
      this.sincronizarReservasActualesDesdeMap();
      this.cdr.detectChanges();
      return;
    }

    const seq = ++this.refreshTodosSeq;
    this.cargandoConteosSlots = true;
    this.cdr.detectChanges();

    const promesas = this.slotsCharla.map(async (s) => {
      const parsed = this.parseSlotValue(s.value);
      if (parsed == null) {
        return { key: s.value, n: null as number | null };
      }
      try {
        const n = await this.reservaCuposService.contarReservasSala(
          id,
          parsed.fecha,
          parsed.horaCharla,
        );
        return { key: s.value, n };
      } catch {
        return { key: s.value, n: null as number | null };
      }
    });

    void Promise.all(promesas).then((results) => {
      if (seq !== this.refreshTodosSeq) {
        return;
      }
      const map: Record<string, number | null> = {};
      for (const r of results) {
        map[r.key] = r.n;
      }
      this.conteosPorSlot = map;
      this.cargandoConteosSlots = false;
      this.limpiarSeleccionSiAgotado();
      this.sincronizarReservasActualesDesdeMap();
      this.cdr.detectChanges();
    });
  }

  private actualizarConteoSlot(): void {
    const id = this.idSala;
    const slot = this.parseSlotSeleccionado();

    if (id == null || slot == null) {
      this.pedidoConteoSeq++;
      this.reservasActuales = null;
      this.cdr.detectChanges();
      return;
    }

    const key = this.slotSeleccionado;
    const seq = ++this.pedidoConteoSeq;
    const cached = this.conteosPorSlot[key];
    this.reservasActuales = typeof cached === 'number' ? cached : null;
    this.cdr.detectChanges();

    void this.reservaCuposService
      .contarReservasSala(id, slot.fecha, slot.horaCharla)
      .then(
        (n) => {
          if (seq !== this.pedidoConteoSeq) {
            return;
          }
          this.conteosPorSlot = { ...this.conteosPorSlot, [key]: n };
          if (this.slotSeleccionado === key) {
            this.reservasActuales = n;
          }
          this.limpiarSeleccionSiAgotado();
          this.cdr.detectChanges();
        },
        () => {
          if (seq !== this.pedidoConteoSeq) {
            return;
          }
          this.conteosPorSlot = { ...this.conteosPorSlot, [key]: null };
          if (this.slotSeleccionado === key) {
            this.reservasActuales = null;
          }
          this.cdr.detectChanges();
        },
      );
  }

  private limpiarSeleccionSiAgotado(): void {
    const max = this.capacidadMax;
    const id = this.idSala;
    if (!this.slotSeleccionado || id == null || max <= 0) {
      return;
    }
    const n = this.conteosPorSlot[this.slotSeleccionado];
    if (typeof n === 'number' && n >= max) {
      this.slotSeleccionado = '';
      this.reservasActuales = null;
      this.pedidoConteoSeq++;
    }
  }

  private sincronizarReservasActualesDesdeMap(): void {
    const v = this.slotSeleccionado;
    if (!v) {
      this.reservasActuales = null;
      return;
    }
    const n = this.conteosPorSlot[v];
    if (typeof n === 'number') {
      this.reservasActuales = n;
    }
  }

  /** Interpreta `slotSeleccionado` (`fecha|horaCharla`). */
  private parseSlotSeleccionado(): { fecha: string; horaCharla: string } | null {
    return this.parseSlotValue(this.slotSeleccionado);
  }

  private parseSlotValue(value: string): { fecha: string; horaCharla: string } | null {
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

  private mensajeErrorReserva(e: unknown): string {
    const code =
      e && typeof e === 'object' && 'code' in e
        ? String((e as { code?: string }).code)
        : '';
    if (code === 'functions/resource-exhausted') {
      return 'No hay cupos para ese turno. Elegí otro día u hora.';
    }
    return 'No se pudo completar la reserva. Intentá de nuevo en unos minutos.';
  }
}
