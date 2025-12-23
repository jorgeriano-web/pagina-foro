import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ServiceBoletas } from '../../service/service-boletas';
import { Pago, PagoRequest } from '../../service/pago';



@Component({
  selector: 'app-registro-no-cliente',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro-no-cliente.html',
  styleUrl: './registro-no-cliente.css',
})
export class RegistroNoCliente implements OnInit {

  currentStep = 1;
  mostrarAsistente2 = false;
  formEnviado = false;
  cantidadBoletas: number = 1;
  precioBoletas: number = 0;
  spinner: boolean = false;

  constructor(private boletasService: ServiceBoletas, private pagoService: Pago) {
    
  }

  ngOnInit(): void {
    this.cantidadBoletas = this.boletasService.getCantidad();
    this.precioBoletas = this.boletasService.getPrecio();
     this.inicializarAsistentes()
    console.log('Cantidad:', this.cantidadBoletas);
    console.log('Precio:', this.precioBoletas);
  }
  
  stepTitles = [
    'Datos de los asistentes',
    'Información de facturación',
    'Confirmar Información'
  ];

  formData = {
    asistentes: [
      { nombre: '', telefono: '', numDoc: '', correo: '' }
    ],
    facturacion: { tipoDoc: '', numDoc: '', nombre: '', correo: '' }
  };

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number) {
    this.currentStep = step;
  }

  agregarAsistente() {
    this.mostrarAsistente2 = true;
  }

  async enviarFormulario() {
  const datosPago: PagoRequest = {
    esCliente: false,
    asistentes: this.formData.asistentes,
    facturacion: this.formData.facturacion,
    cantidad_boletas: this.cantidadBoletas,
    precio_total: this.precioBoletas
  };

  this.spinner = true;

  try {
    const response = await this.pagoService.crearLinkPago(datosPago);
    
    if (response.success) {
      localStorage.setItem('pagoReferencia', response.referencia);
      
      this.pagoService.redirigirAPago(response.shortLink);
    }
  } catch (error) {
    console.error('Error al generar link de pago:', error);
    this.spinner = false;
  }
}

   inicializarAsistentes(){
    this.formData.asistentes = [];
    for (let i = 0; i < this.cantidadBoletas; i++) {
      this.formData.asistentes.push({ nombre: '', telefono: '', numDoc: '', correo: '' });
    }
   }




}
