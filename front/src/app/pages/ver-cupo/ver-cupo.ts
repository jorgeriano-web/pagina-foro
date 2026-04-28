/**
 * Pantalla pública `/cupo/:uuid`: muestra datos de la reserva si el UUID existe en Sheets.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReservaCupos } from '../../service/reserva-cupos';
import type { ResultadoCupoPorUuid } from '../../service/reserva-cupos.types';
import { RX_UUID_V4_CUPO } from './ver-cupo.constants';

@Component({
  selector: 'app-ver-cupo',
  imports: [CommonModule],
  templateUrl: './ver-cupo.html',
  styleUrl: './ver-cupo.css',
  standalone: true,
})
export class VerCupo implements OnInit {
  estado: 'cargando' | 'invalido' | 'no_encontrado' | 'error' | 'ok' = 'cargando';
  datos: Extract<ResultadoCupoPorUuid, { encontrada: true }> | null = null;

  constructor(
    private route: ActivatedRoute,
    private reservaCupos: ReservaCupos,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid')?.trim() ?? '';
    if (!RX_UUID_V4_CUPO.test(uuid)) {
      this.estado = 'invalido';
      this.cdr.detectChanges();
      return;
    }
    void this.cargar(uuid);
  }

  private async cargar(uuid: string): Promise<void> {
    this.estado = 'cargando';
    this.cdr.detectChanges();
    try {
      const r = await this.reservaCupos.obtenerCupoPorUuid(uuid);
      if (!r || typeof r.encontrada !== 'boolean') {
        this.estado = 'error';
      } else if (!r.encontrada) {
        this.estado = 'no_encontrado';
      } else {
        this.datos = r;
        this.estado = 'ok';
      }
    } catch (e) {
      console.error('VerCupo: error al consultar cupo', e);
      this.estado = 'error';
    } finally {
      this.cdr.detectChanges();
    }
  }
}
