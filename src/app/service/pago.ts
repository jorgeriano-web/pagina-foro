import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

// Interfaces
interface AsistenteData {
  nombre: string;
  telefono: string;
  numDoc: string;
  correo: string;
}

interface InmobiliariaData {
  poliza: string;
  inmobiliaria: string;
  ciudad: string;
  ejecutivo: string;
}

interface Facturacion {
  tipoDoc: string;
  numDoc: string;
  nombre: string;
  correo: string;
}

export interface PagoRequest {
  esCliente: boolean;
  inmobiliaria?: InmobiliariaData;
  asistentes: AsistenteData[];
  facturacion: Facturacion;
  cantidad_boletas: number;
  precio_total: number;
}

export interface PagoResponse {
  success: boolean;
  payLink: string;
  shortLink: string;
  referencia: string;
  transaccionId: string;
}

export interface VerificarPagoResponse{
  success: boolean;
  estado: string;
  datos?: any;
}

@Injectable({
  providedIn: 'root',
})
export class Pago {

  constructor(private functions : Functions){}

  async crearLinkPago(datos: PagoRequest): Promise<PagoResponse> {
    const callable = httpsCallable<PagoRequest, PagoResponse>(this.functions, 'crearLinkPago');
    const result = await callable(datos);
    return result.data;
  }

  redirigirAPago(payLink: string): void {
    window.location.href = payLink;
  }

  async verificarPago(referencia: string){
    const callable = httpsCallable<{ referencia: string }, VerificarPagoResponse>(
      this.functions, 
      'verificarEstadoPago'
    );
    const result = await callable({ referencia });
    return result.data;
  }
  
}
