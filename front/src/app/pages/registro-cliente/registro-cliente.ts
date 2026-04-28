/**
 * Registro y pago para asistentes que son clientes Bolívar (wizard por pasos).
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from "@angular/router";
import { ServiceBoletas } from '../../service/service-boletas';
import { Pago, PagoRequest } from '../../service/pago';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

declare var fbq: any;

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
  dataLayer: any[] = (window as any).dataLayer || [];


  constructor(private boletasService: ServiceBoletas, 
    private pagoService: Pago, 
    private http: HttpClient,
    private cdr: ChangeDetectorRef){}

  ngOnInit(): void {
    let cantidad = this.boletasService.getCantidad();
    if (!cantidad || cantidad < 1) {
      this.boletasService.seleccionarCantidadBoletas(1);
      cantidad = this.boletasService.getCantidad();
    }
    this.cantidadBoletas = cantidad;
    this.precioBoletas = this.boletasService.getPrecio();
    this.inicializarAsistentes();
  }

  stepTitles = [
    'Datos de la inmobiliaria',
    'Datos de los asistentes',
    'Datos de facturación',
    'Confirmar Información'
  ];

  formData = {
    poliza: { numero: '', inmobiliaria: '', ciudad: '', ejecutivo: '', segmento: '', contratos: 0, primas:''},
    asistentes: [
      { nombre: '', telefono: '', numDoc: '', correo: '' }
    ],
    facturacion: { tipoDoc: '', numDoc: '', nombre: '', correo: '' }
  };

  // URL del script de Google para validar póliza
  private GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQqpkFd5pxVcaTlCgydAdKvw3-LQpjTTCuKhGTb8G4F3tl_8BwHnsSuu81dqZm9td82Q/exec';

  private pushDataLayerSafe(payload: object): void {
    try {
      this.dataLayer.push(payload);
    } catch {
      /* no bloquear el flujo por analytics */
    }
  }

  private parsePolizaResponse(raw: unknown): any {
    if (raw == null) return null;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw[0];
    }
    return raw;
  }

  private isPolizaSuccess(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    const s = (data as { success?: unknown }).success;
    if (s === true || s === 1) return true;
    if (typeof s === 'string') return s.toLowerCase() === 'true' || s === '1';
    return false;
  }

  async validarPoliza(): Promise<boolean> {
    if (!this.formData.poliza.numero) {
      this.polizaError = 'Ingresa el número de póliza';
      return false;
    }

    this.validandoPoliza = true;
    this.polizaError = '';

    const url = `${this.GOOGLE_SCRIPT_URL}?poliza=${encodeURIComponent(this.formData.poliza.numero.trim())}`;

    try {
      const raw = await firstValueFrom(this.http.get<unknown>(url));
      const data = this.parsePolizaResponse(raw);

      if (this.isPolizaSuccess(data)) {
        this.formData.poliza.inmobiliaria = data.inmobiliaria ?? '';
        this.formData.poliza.ciudad = data.ciudad ?? '';
        this.formData.poliza.ejecutivo = data.ejecutivo ?? '';
        this.formData.poliza.segmento = data.segmento ?? '';
        this.formData.poliza.contratos = Number(data.contratos) || 0;
        this.formData.poliza.primas = data.primas ?? '';
        this.polizaValidada = true;
        this.validandoPoliza = false;
        this.cdr.detectChanges();
        return true;
      }
      this.polizaError = data?.message || 'Póliza no encontrada.';
      this.validandoPoliza = false;
      this.cdr.detectChanges();
      return false;
    } catch {
      this.polizaError = 'No se pudo conectar. Intente de nuevo.';
      this.validandoPoliza = false;
      this.cdr.detectChanges();
      return false;
    }
  }

  nextStep(): void {
    if (this.currentStep === 1 && !this.polizaValidada) {
      return;
    }

    try {
      if (this.currentStep === 2) {
        this.pushDataLayerSafe({
          event: 'ga_event',
          category: 'foro 2026',
          action: 'AMW - datos de asistentes-siguiente',
          label: 'Siguiente',
        });
      }
      if (this.currentStep === 3) {
        this.pushDataLayerSafe({
          event: 'ga_event',
          category: 'foro 2026',
          action: 'AMW - informacion de facturacion',
          label: 'siguiente',
        });
      }
    } catch {
      /* seguir al cambio de paso */
    }

    if (this.currentStep < 4) {
      this.currentStep++;
    }
    this.cdr.detectChanges();
  }

  prevStep(): void {
    if (this.currentStep === 4) {
      this.pushDataLayerSafe({
        event: 'ga_event',
        category: 'foro 2026',
        action: 'AMW - informacion de facturacion',
        label: 'anterior',
      });
    }

    if (this.currentStep > 1) {
      this.currentStep--;
    }
    this.cdr.detectChanges();
  }

  goToStep(step: number) {
    this.currentStep = step;
  }

  agregarAsistente() {
    this.mostrarAsistente2 = true;
  }

  async enviarFormulario() {
    this.pushDataLayerSafe({
      event: 'ga_event',
      category: 'foro 2026',
      action: 'AMW - confirmar y pagar',
      label: 'Confirmar y pagar',
    });

    this.spinner = true;
    this.cdr.detectChanges();
    await Promise.resolve();

    const esValida = await this.validarPoliza();

    if (!esValida) {
      this.spinner = false;
      this.cdr.detectChanges();
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
      segmento: this.formData.poliza.segmento,
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
        if (typeof fbq !== 'undefined') {
          fbq('track', 'Purchase');
        }

        localStorage.setItem('pagoReferencia', response.referencia);
        this.pagoService.redirigirAPago(response.shortLink);
      } else {
        this.spinner = false;
        this.cdr.detectChanges();
        alert('No se pudo generar el link de pago. Intenta de nuevo.');
      }
    } catch {
      this.spinner = false;
      this.cdr.detectChanges();
      alert('Hubo un error, vuelve a intentarlo');
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

  /** Devuelve las secciones que faltan por completar (para el popup). */
  getMissingSections(): string[] {
    const faltantes: string[] = [];
    if (!this.formData.poliza.numero || !this.polizaValidada ||
        !this.formData.poliza.inmobiliaria || !this.formData.poliza.ciudad || !this.formData.poliza.ejecutivo) {
      faltantes.push('Datos de la inmobiliaria');
    }
    for (const asistente of this.formData.asistentes) {
      if (!asistente.nombre || !asistente.numDoc || !asistente.telefono || !asistente.correo) {
        faltantes.push('Datos de los asistentes');
        break;
      }
    }
    const fact = this.formData.facturacion;
    if (!fact.tipoDoc || !fact.numDoc || !fact.nombre || !fact.correo) {
      faltantes.push('Datos de facturación');
    }
    return faltantes;
  }

  showFaltantesPopup = false;
  seccionesFaltantes: string[] = [];

  async intentarEnviar(): Promise<void> {
    if (this.spinner) return;
    if (!this.isFormValid()) {
      this.seccionesFaltantes = this.getMissingSections();
      this.showFaltantesPopup = true;
      return;
    }
    await this.enviarFormulario();
  }

  cerrarPopupFaltantes() {
    this.showFaltantesPopup = false;
  }



}
