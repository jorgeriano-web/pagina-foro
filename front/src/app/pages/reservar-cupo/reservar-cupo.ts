import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit, Optional } from '@angular/core';
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

@Component({
  selector: 'app-reservar-cupo',
  imports: [CommonModule, FormsModule],
  templateUrl: './reservar-cupo.html',
  styleUrl: './reservar-cupo.css',
  standalone: true,
})
export class ReservarCupo implements OnInit {
  nombre = '';
  numDoc = '';
  correo = '';
  /** Valor `YYYY-MM-DD|HH:mm` (fecha y hora de la charla). */
  slotSeleccionado = '';
  readonly slotsCharla: { value: string; label: string }[] = [
    { value: '2026-05-21|14:30', label: '21 de mayo, 2:30 p. m.' },
    { value: '2026-05-21|16:45', label: '21 de mayo, 4:45 p. m.' },
    { value: '2026-05-22|14:30', label: '22 de mayo, 2:30 p. m.' },
    { value: '2026-05-22|16:45', label: '22 de mayo, 4:45 p. m.' },
  ];
  procesando = false;
  reservaExitosa = false;
  errorReserva: string | null = null;
  /** Conteo desde el sheet; null = cargando o sin sala. */
  reservasActuales: number | null = null;

  constructor(
    @Optional() private dialogRef: MatDialogRef<ReservarCupo> | null,
    @Optional() @Inject(MAT_DIALOG_DATA) private data: ReservaCupoDialogData | null,
    @Optional() private route: ActivatedRoute | null,
    private reservaCuposService: ReservaCupos,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.idSala;
    if (id == null) {
      return;
    }
    void this.reservaCuposService.contarReservasSala(id).then(
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

  get capacidadMax(): number {
    const id = this.idSala;
    return id == null ? 0 : capacidadSala(id);
  }

  get textoCuposDialogo(): string {
    const max = this.capacidadMax;
    if (max <= 0) {
      return '';
    }
    const n = this.reservasActuales;
    if (n === null) {
      return 'Consultando cupos…';
    }
    return `Reservas: ${n} de ${max}.`;
  }

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

  cerrarDialogo(): void {
    this.dialogRef?.close();
  }


  async contarReservasSala(): Promise<number> {
    const id = this.idSala;
    if (id == null) {
      return 0;
    }
    return await this.reservaCuposService.contarReservasSala(id);
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
    const partes = this.slotSeleccionado.split('|');
    const fechaCharla = partes[0] ?? '';
    const horaCharla = (partes[1] ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaCharla) || !/^\d{1,2}:\d{2}$/.test(horaCharla)) {
      this.errorReserva = 'Elegí una fecha y hora válidas.';
      return;
    }
    this.errorReserva = null;
    this.procesando = true;
    this.cdr.detectChanges();
    try {
      await this.reservaCuposService.reservaSalaCupo({
        idSala,
        fecha: fechaCharla,
        horaCharla,
        nombre,
        numDoc,
        correo,
      });
      this.reservaExitosa = true;
      const prev = this.reservasActuales;
      this.reservasActuales = prev == null ? null : prev + 1;
    } catch {
      this.errorReserva =
        'No se pudo completar la reserva. Intentá de nuevo en unos minutos.';
    } finally {
      this.procesando = false;
      this.cdr.detectChanges();
    }
  }

  cerrarTrasExito(): void {
    this.dialogRef?.close({ ok: true });
  }
}
