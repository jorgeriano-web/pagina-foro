import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';

/** Datos que envía la landing al abrir el MatDialog. */
export interface ReservaCupoDialogData {
  idSala: number;
  nombreExperiencia: string;
}

@Component({
  selector: 'app-reservar-cupo',
  imports: [],
  templateUrl: './reservar-cupo.html',
  styleUrl: './reservar-cupo.css',
  standalone: true,
})
export class ReservarCupo {
  constructor(
    @Optional() private dialogRef: MatDialogRef<ReservarCupo> | null,
    @Optional() @Inject(MAT_DIALOG_DATA) private data: ReservaCupoDialogData | null,
    @Optional() private route: ActivatedRoute | null,
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

  reservarCupo(): void {

  }
  
}
