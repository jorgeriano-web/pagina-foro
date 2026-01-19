import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ServiceBoletas {

  private cantidad: number = 0;
  private precio: number = 0;

  private readonly precios: {[key: number]: number} ={
    1: 280000,
    2: 520000,
    3: 640000
  }

  seleccionarCantidadBoletas(cantidad: 1 | 2 | 3): void{
    this.cantidad = cantidad;
    this.precio =  this.precios[cantidad];
  }

  getCantidad(): number {
    return this.cantidad;
  }

  getPrecio(): number {
    return this.precio;
  }

  getPrecioFormateado(): string {
    return this.precio.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    });
  }
  
}
