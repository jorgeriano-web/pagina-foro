import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiceBoletas } from '../../service/service-boletas';

@Component({
  selector: 'app-inicio-registro',
  imports: [CommonModule, FormsModule],
  templateUrl: './inicio-registro.html',
  styleUrl: './inicio-registro.css',
})
export class InicioRegistro implements OnInit {

  opcionCliente: string = '';
  mostrarError: boolean = false;
  


  constructor(private router: Router, private boletasService: ServiceBoletas) {}

  ngOnInit(): void {
    console.log('Cantidad:', this.boletasService.getCantidad());
    console.log('Precio:', this.boletasService.getPrecio());
  }

  siguiente() {
    if (!this.opcionCliente) {
      this.mostrarError = true;
      return;
    }

    this.mostrarError = false;

    if (this.opcionCliente === 'si') {
      this.router.navigate(['/registro-cliente']);
    } else {
      this.router.navigate(['/registro-no-cliente']);
    }
  }

}
