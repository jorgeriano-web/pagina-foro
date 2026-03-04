import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ServiceBoletas } from '../../service/service-boletas';

@Component({
  selector: 'app-inicio-registro',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inicio-registro.html',
  styleUrl: './inicio-registro.css',
})
export class InicioRegistro implements OnInit {

  opcionCliente: string = '';
  mostrarError: boolean = false;
  dataLayer: any[] = (window as any).dataLayer || [];


  constructor(private router: Router, private boletasService: ServiceBoletas) {}

  ngOnInit(): void {
    
  }

  siguiente() {
    if (!this.opcionCliente) {
      this.mostrarError = true;
      return;
    }

    this.mostrarError = false;

    this.dataLayer.push({
      event: 'ga_event',
      category: 'foro 2026',
      action: 'AMW - cliente libertador',
      label: this.opcionCliente 
    });

    if (this.opcionCliente === 'si') {

      this.router.navigate(['/registro-cliente']);
    } else {
      this.router.navigate(['/registro-no-cliente']);
    }
  }

}
