import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from "@angular/router";
import { ServiceBoletas } from '../../service/service-boletas';
import { Pago, PagoRequest } from '../../service/pago';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-registro-cliente',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro-cliente.html',
  styleUrl: './registro-cliente.css',
})
export class RegistroCliente implements OnInit {

   currentStep = 1;
  mostrarAsistente2 = false;
  formEnviado = false;
  polizaValidada = false;
  validandoPoliza = false;
  polizaError = '';
  cantidadBoletas: number = 1;
  precioBoletas: number = 0;
  spinner: boolean = false;

  constructor(private boletasService: ServiceBoletas, 
    private pagoService: Pago, 
    private http: HttpClient,
    private cdr: ChangeDetectorRef){}

  ngOnInit(): void {
    this.cantidadBoletas = this.boletasService.getCantidad();
    this.precioBoletas = this.boletasService.getPrecio();
    this.inicializarAsistentes()
    console.log('Cantidad:', this.cantidadBoletas);
    console.log('Precio:', this.precioBoletas);
  }

  stepTitles = [
    'Datos de la inmobiliaria',
    'Datos de los asistentes',
    'Datos de facturación',
    'Confirmar Información'
  ];

  formData = {
    poliza: { numero: '', inmobiliaria: '', ciudad: '', ejecutivo: '' },
    asistentes: [
      { nombre: '', telefono: '', numDoc: '', correo: '' }
    ],
    facturacion: { tipoDoc: '', numDoc: '', nombre: '', correo: '' }
  };

  // URL del script de Google para validar póliza
  private GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQqpkFd5pxVcaTlCgydAdKvw3-LQpjTTCuKhGTb8G4F3tl_8BwHnsSuu81dqZm9td82Q/exec';

 validarPoliza() {
  if (!this.formData.poliza.numero) {
    this.polizaError = 'Ingresa el número de póliza';
    return;
  }

  this.validandoPoliza = true;
  this.polizaError = '';

  const url = `${this.GOOGLE_SCRIPT_URL}?poliza=${this.formData.poliza.numero}`;

  this.http.get<any>(url).subscribe({
    next: (data) => {
      if (data.success) {
        this.formData.poliza.inmobiliaria = data.inmobiliaria;
        this.formData.poliza.ciudad = data.ciudad;
        this.formData.poliza.ejecutivo = data.ejecutivo;
        this.polizaValidada = true;
      } else {
        this.polizaError = data.message || 'Póliza no encontrada.';
      }
      this.validandoPoliza = false;
      
      this.cdr.detectChanges(); 
    },
    error: () => {
      this.polizaError = 'No se pudo conectar. Intente de nuevo.';
      this.validandoPoliza = false;
    }
  });
}


  nextStep() {
    if (this.currentStep < 4) {
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
    esCliente: true,
    inmobiliaria: {
      poliza: this.formData.poliza.numero,
      inmobiliaria: this.formData.poliza.inmobiliaria,
      ciudad: this.formData.poliza.ciudad,
      ejecutivo: this.formData.poliza.ejecutivo
    },
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
      // Redirigir al gateway de pago
      this.pagoService.redirigirAPago(response.shortLink);
    }
  } catch (error) {
    this.spinner = false;
    alert("Hubo un error, vuelve a intentarlo")

    // Mostrar mensaje de error al usuario
  }
  }

  inicializarAsistentes(){
    this.formData.asistentes = [];
    for (let i = 0; i < this.cantidadBoletas; i++) {
      this.formData.asistentes.push({ nombre: '', telefono: '', numDoc: '', correo: '' });
    }
  }



}
