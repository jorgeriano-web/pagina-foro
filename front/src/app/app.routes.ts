import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { InicioRegistro } from './pages/inicio-registro/inicio-registro';
import { RegistroCliente } from './pages/registro-cliente/registro-cliente';
import { RegistroNoCliente } from './pages/registro-no-cliente/registro-no-cliente';
import { PagoExitoso } from './pages/pago-exitoso/pago-exitoso';
import { PagoFallido } from './pages/pago-fallido/pago-fallido';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'inicio-registro', component: InicioRegistro },
  { path: 'registro-cliente', component: RegistroCliente },
  { path: 'registro-no-cliente', component: RegistroNoCliente },
  { path:'pagoExitoso', component: PagoExitoso},
  { path:'pagoNoExitoso', component: PagoFallido},
  { path: '**', redirectTo: '' }
];
