import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from "@angular/router";
import { ServiceBoletas } from '../../service/service-boletas';
import { Pago, PagoRequest } from '../../service/pago';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
  }

  stepTitles = [
    'Datos de la inmobiliaria',
    'Datos de los asistentes',
    'Datos de facturación',
    'Confirmar Información'
  ];

  formData = {
    poliza: { numero: '', inmobiliaria: '', ciudad: '', ejecutivo: '', segmentacion: '', contratos: 0, primas:''},
    asistentes: [
      { nombre: '', telefono: '', numDoc: '', correo: '' }
    ],
    facturacion: { tipoDoc: '', numDoc: '', nombre: '', correo: '' }
  };

  // URL del script de Google para validar póliza
  private GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQqpkFd5pxVcaTlCgydAdKvw3-LQpjTTCuKhGTb8G4F3tl_8BwHnsSuu81dqZm9td82Q/exec';

async validarPoliza(): Promise<boolean> {
  if (!this.formData.poliza.numero) {
    this.polizaError = 'Ingresa el número de póliza';
    return false;
  }

  this.validandoPoliza = true;
  this.polizaError = '';

  const url = `${this.GOOGLE_SCRIPT_URL}?poliza=${this.formData.poliza.numero}`;

  try {
    
    const data = await firstValueFrom(this.http.get<any>(url));
    
    if (data.success) {
      this.formData.poliza.inmobiliaria = data.inmobiliaria;
      this.formData.poliza.ciudad = data.ciudad;
      this.formData.poliza.ejecutivo = data.ejecutivo;
      this.formData.poliza.segmentacion = data.segmentacion;
      this.formData.poliza.contratos = Number(data.contratos);
      this.formData.poliza.primas = data.primas;
      this.polizaValidada = true;
      this.validandoPoliza = false;
      this.cdr.detectChanges();
      return true;
    } else {
      this.polizaError = data.message || 'Póliza no encontrada.';
      this.validandoPoliza = false;
      return false;
    }
  } catch (error) {
    this.polizaError = 'No se pudo conectar. Intente de nuevo.';
    this.validandoPoliza = false;
    return false;
  }
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

    this.spinner = true;

    const esValida = await this.validarPoliza();

    if (!esValida) {
    this.spinner = false;
    alert('Error: La póliza no es válida.');
    return;
    }

    const datosPago: PagoRequest = {
    esCliente: true,
    inmobiliaria: {
      poliza: this.formData.poliza.numero,
      inmobiliaria: this.formData.poliza.inmobiliaria,
      ciudad: this.formData.poliza.ciudad,
      ejecutivo: this.formData.poliza.ejecutivo,
      segmentacion: this.formData.poliza.segmentacion,
      contratos: this.formData.poliza.contratos,
      primas: this.formData.poliza.primas
    },
    asistentes: this.formData.asistentes,
    facturacion: this.formData.facturacion,
    cantidad_boletas: this.cantidadBoletas
  };


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


  isFormValid(): boolean {
  // 1️⃣ Validar póliza
  if (!this.formData.poliza.numero || 
      !this.polizaValidada ||
      !this.formData.poliza.inmobiliaria ||
      !this.formData.poliza.ciudad ||
      !this.formData.poliza.ejecutivo) {
    return false;
  }

  // 2️⃣ Validar asistentes
  for (const asistente of this.formData.asistentes) {
    if (!asistente.nombre || !asistente.numDoc || !asistente.telefono || !asistente.correo) {
      return false;
    }
  }

  // 3️⃣ Validar facturación
  const fact = this.formData.facturacion;
  if (!fact.tipoDoc || !fact.numDoc || !fact.nombre || !fact.correo) {
    return false;
  }

  // ✅ Todo está completo
  return true;
}



}
