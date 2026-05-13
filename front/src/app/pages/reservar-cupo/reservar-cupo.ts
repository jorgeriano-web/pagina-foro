/**
 * Formulario de reserva de cupo por sala: diálogo (landing) o ruta `/reservar-cupos`.
 * Usa slots y validación de sala en archivos colindantes (`*.slots.ts`, `*.salas.ts`).
 */
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
import { ReservaCupos } from '../../service/reserva-cupos';
import {
  OpcionSlotSelect,
  RX_FECHA_YMD,
  parseSlotCharlaValue,
  slotsCharlaFiltradosPorFechas,
} from './reservar-cupo.slots';
import { esIdSalaReserva } from './reservar-cupo.salas';

/** Datos que envía la landing al abrir el MatDialog. */
export interface ReservaCupoDialogData {
  idSala: number;
  nombreExperiencia: string;
  /** Opcional: solo turnos de estas fechas (`YYYY-MM-DD`), p. ej. sala 4 día 1 vs día 2. */
  fechasSlotPermitidas?: readonly string[];
}

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

  /** Config de salas desde el back (`listarSalasExperienciaProd`). */
  salasConfigEstado: 'loading' | 'ok' | 'error' = 'loading';
  private salasPorId: Record<number, { capacidadTotal: number }> = {};

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
    void this.cargarConfigSalasYLuegoConteos();
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
    return !Number.isNaN(n) && esIdSalaReserva(n) ? n : null;
  }

  get nombreExperiencia(): string {
    if (this.data?.nombreExperiencia) {
      return this.data.nombreExperiencia;
    }
    return this.route?.snapshot.queryParamMap.get('titulo') ?? '';
  }

  get slotsEfectivos() {
    return slotsCharlaFiltradosPorFechas(this.data?.fechasSlotPermitidas);
  }

  get capacidadMax(): number {
    const id = this.idSala;
    if (id == null || this.salasConfigEstado !== 'ok') {
      return 0;
    }
    return this.salasPorId[id]?.capacidadTotal ?? 0;
  }

  get mensajeErrorConfigSalas(): string | null {
    return this.salasConfigEstado === 'error'
      ? 'No se pudo cargar la información de cupos. Reintentá o actualizá la página.'
      : null;
  }

  get opcionesSlotSelect(): OpcionSlotSelect[] {
    const id = this.idSala;
    const max = this.capacidadMax;
    if (this.salasConfigEstado === 'loading' || this.salasConfigEstado === 'error') {
      return this.slotsEfectivos.map((s) => ({
        value: s.value,
        label: s.label,
        disabled: true,
      }));
    }
    return this.slotsEfectivos.map((s) => {
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
        label: lleno ? `${s.label} — Agotado` : s.label,
        disabled: lleno,
      };
    });
  }

  get textoCuposDialogo(): string {
    if (this.salasConfigEstado === 'loading') {
      return 'Cargando cupos por sala…';
    }
    if (this.salasConfigEstado === 'error') {
      return '';
    }
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

  reintentarCargaSalas(): void {
    this.reservaCuposService.invalidarCacheSalasExperiencia();
    void this.cargarConfigSalasYLuegoConteos();
  }

  cerrarDialogo(): void {
    this.dialogRef?.close();
  }

  cerrarTrasExito(): void {
    this.dialogRef?.close({ ok: true });
  }

  async reservaCupo(): Promise<void> {
    const idSala = this.idSala;
    if (
      idSala == null ||
      this.procesando ||
      this.reservaExitosa ||
      this.salasConfigEstado !== 'ok'
    ) {
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

    const permitidas = this.fechasSlotPermitidasSet();
    if (permitidas != null && permitidas.size > 0 && !permitidas.has(slot.fecha)) {
      this.errorReserva = 'Elegí un turno válido para esta experiencia.';
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

  private async cargarConfigSalasYLuegoConteos(): Promise<void> {
    this.salasConfigEstado = 'loading';
    this.cdr.detectChanges();
    try {
      const salas = await this.reservaCuposService.listarSalasExperiencia();
      const map: Record<number, { capacidadTotal: number }> = {};
      for (const s of salas) {
        if (esIdSalaReserva(s.id)) {
          map[s.id] = { capacidadTotal: s.capacidadTotal };
        }
      }
      this.salasPorId = map;
      this.salasConfigEstado = 'ok';
    } catch {
      this.salasPorId = {};
      this.salasConfigEstado = 'error';
    }
    this.cdr.detectChanges();
    this.refrescarConteosTodosSlots();
  }

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

    const promesas = this.slotsEfectivos.map(async (s) => {
      const parsed = parseSlotCharlaValue(s.value);
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
      this.limpiarSlotSiFueraDeSlotsVisibles();
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

  private fechasSlotPermitidasSet(): Set<string> | null {
    const raw = this.data?.fechasSlotPermitidas;
    if (raw == null || raw.length === 0) {
      return null;
    }
    const set = new Set(
      raw.map((f) => f.trim()).filter((f) => RX_FECHA_YMD.test(f)),
    );
    return set.size > 0 ? set : null;
  }

  private limpiarSlotSiFueraDeSlotsVisibles(): void {
    if (!this.slotSeleccionado) {
      return;
    }
    if (!this.slotsEfectivos.some((s) => s.value === this.slotSeleccionado)) {
      this.slotSeleccionado = '';
      this.reservasActuales = null;
      this.pedidoConteoSeq++;
    }
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
    return parseSlotCharlaValue(this.slotSeleccionado);
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
