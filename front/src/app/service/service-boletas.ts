import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ServiceBoletas {

  private cantidad: number = 0;
  private precio: number = 0;

  private readonly precios: {[key: number]: number} ={
    1: 330000,
    2: 620000,
    3: 780000,
    4: 1000000,
    5: 1150000,
    6: 1320000,
    7: 1470000,
    8: 1600000,
    10: 1900000,
  }

  seleccionarCantidadBoletas(cantidad: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10): void{
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
