import { CommonModule } from '@angular/common';
import { Component, Inject, Optional } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
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
export class ReservarCupo {
  nombre = '';
  numDoc = '';

  constructor(
    @Optional() private dialogRef: MatDialogRef<ReservarCupo> | null,
    @Optional() @Inject(MAT_DIALOG_DATA) private data: ReservaCupoDialogData | null,
    @Optional() private route: ActivatedRoute | null,
    private reservaCuposService: ReservaCupos,
  ) {}

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
    if (idSala == null) {
      return;
    }
    await this.reservaCuposService.reservaSalaCupo({
      idSala,
      fecha: new Date().toISOString(),
      nombre: this.nombre,
      numDoc: this.numDoc,
    });
  }
}
