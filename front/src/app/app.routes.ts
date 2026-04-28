/**
 * Mapa de URL → página (standalone). El resto de rutas cae en la landing.
 */
import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { InicioRegistro } from './pages/inicio-registro/inicio-registro';
import { RegistroCliente } from './pages/registro-cliente/registro-cliente';
import { RegistroNoCliente } from './pages/registro-no-cliente/registro-no-cliente';
import { PagoExitoso } from './pages/pago-exitoso/pago-exitoso';
import { PagoFallido } from './pages/pago-fallido/pago-fallido';
import { ReservarCupo } from './pages/reservar-cupo/reservar-cupo';
import { VerCupo } from './pages/ver-cupo/ver-cupo';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'inicio-registro', component: InicioRegistro },
  { path: 'registro-cliente', component: RegistroCliente },
  { path: 'registro-no-cliente', component: RegistroNoCliente },
  { path: 'reservar-cupos', component: ReservarCupo },
  { path: 'cupo/:uuid', component: VerCupo },
  { path:'pagoExitoso', component: PagoExitoso},
  { path:'pagoNoExitoso', component: PagoFallido},
  { path: '**', redirectTo: '' }
];
