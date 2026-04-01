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

  constructor(
    @Optional() private dialogRef: MatDialogRef<ReservarCupo> | null,
    @Optional() @Inject(MAT_DIALOG_DATA) private data: ReservaCupoDialogData | null,
    @Optional() private route: ActivatedRoute | null,
    private reservaCuposService: ReservaCupos,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.actualizarConteoSlot();
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

  // ——— Acciones template ———

  onSlotChange(): void {
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
      this.actualizarConteoSlot();
    } catch (e: unknown) {
      this.errorReserva = this.mensajeErrorReserva(e);
    } finally {
      this.procesando = false;
      this.cdr.detectChanges();
    }
  }

  // ——— Internos ———

  private actualizarConteoSlot(): void {
    const id = this.idSala;
    const slot = this.parseSlotSeleccionado();

    if (id == null || slot == null) {
      this.reservasActuales = null;
      this.cdr.detectChanges();
      return;
    }

    void this.reservaCuposService
      .contarReservasSala(id, slot.fecha, slot.horaCharla)
      .then(
        (n) => {
          this.reservasActuales = n;
          this.cdr.detectChanges();
        },
        () => {
          this.reservasActuales = null;
          this.cdr.detectChanges();
        },
      );
  }

  /** Interpreta `slotSeleccionado` (`fecha|horaCharla`). */
  private parseSlotSeleccionado(): { fecha: string; horaCharla: string } | null {
    if (!this.slotSeleccionado) {
      return null;
    }
    const partes = this.slotSeleccionado.split('|');
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
