import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ServiceBoletas } from '../../service/service-boletas';

@Component({
  selector: 'app-landing',
  imports: [CommonModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  standalone: true
})
export class Landing implements OnInit, OnDestroy {

  dataLayer: any[] = (window as any).dataLayer || [];
  isScrolled = false;
  isMenuOpen = false;
  timeleft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
  };
  intervalId: any;

  constructor(private boletasService: ServiceBoletas, private router: Router, private cdRef: ChangeDetectorRef){}

  ngOnInit(): void {
    const fechaForo = new Date(2026, 2, 1 , 0, 0, 0);

    // Primera ejecución inmediata
    this.actualizarTiempo(fechaForo);

    this.intervalId = setInterval(() => {
      this.actualizarTiempo(fechaForo);
      this.cdRef.detectChanges(); 
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
  
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  ngAfterViewInit() {
    document.addEventListener('click', (e: Event) => {
        
      const target = e.target as HTMLElement;
      
      // Si se hizo clic en "Saber más"
      if (target.classList.contains('saber-mas-btn')) {
        const card = target.closest('.animatable-card');
        if (!card) return;
        
        const originalContent = card.querySelector('.card-original-content');
        const flippedContent = card.querySelector('.card-flipped-content');
        
        if (originalContent && flippedContent) {
          originalContent.classList.add('opacity-0', 'pointer-events-none');
          flippedContent.classList.remove('opacity-0', 'pointer-events-none');
          card.classList.remove('bg-white/10');
          card.classList.add('bg-white');
        }
      }
      
      // Si se hizo clic en "Volver"
      if (target.classList.contains('volver-btn')) {
        const card = target.closest('.animatable-card');
        if (!card) return;
        
        const originalContent = card.querySelector('.card-original-content');
        const flippedContent = card.querySelector('.card-flipped-content');
        
        if (originalContent && flippedContent) {
          originalContent.classList.remove('opacity-0', 'pointer-events-none');
          flippedContent.classList.add('opacity-0', 'pointer-events-none');
          card.classList.remove('bg-white');
          card.classList.add('bg-white/10');
        }
      }
    });
  }

  seleccionarBoletas(cantidad: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8): void{

    if (cantidad === 1) {
      this.dataLayer.push({
        event: 'ga_event',
        category: 'foro 2026',
        action: 'AMW - comprar 1 entrada',
        label: 'Comprar 1 entrada'
      });
    }

    if (cantidad === 2) {
      this.dataLayer.push({
        event: 'ga_event',
        category: 'foro 2026',
        action: 'AMW - comprar 2 entradas',
        label: 'Comprar 2 entradas'
      });
    }

    if (cantidad === 3) {
      this.dataLayer.push({
        event: 'ga_event',
        category: 'foro 2026',
        action: 'AMW - comprar 3 entradas',
        label: 'Comprar 3 entradas'
      });
    }

    if (cantidad === 4) {
      this.dataLayer.push({
        event: 'ga_event',
        category: 'foro 2026',
        action: 'AMW - necesito mas entradas',
        label: 'Comprar 4 entradas'
      });
    }

    if (cantidad === 5) {
      this.dataLayer.push({
        event: 'ga_event',
        category: 'foro 2026',
        action: 'AMW - necesito mas entradas',
        label: 'Comprar 5 entradas'
      });
    }

    if (cantidad === 6) {
      this.dataLayer.push({
        event: 'ga_event',
        category: 'foro 2026',
        action: 'AMW - necesito mas entradas',
        label: 'Comprar 6 entradas'
      });
    }

    if (cantidad === 7) {
      this.dataLayer.push({
        event: 'ga_event',
        category: 'foro 2026',
        action: 'AMW - necesito mas entradas',
        label: 'Comprar 7 entradas'
      });
    }

    if (cantidad === 8) {
      this.dataLayer.push({
        event: 'ga_event',
        category: 'foro 2026',
        action: 'AMW - necesito mas entradas',
        label: 'Comprar 8 entradas'
      });
    }

    this.boletasService.seleccionarCantidadBoletas(cantidad);
    this.router.navigate(['/inicio-registro'])
  }

  actualizarTiempo(fechaForo: Date) {
    const ahora = new Date().getTime();
    let diferencia = fechaForo.getTime() - ahora;

    if (diferencia <= 0) {
      this.timeleft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds:0
      };
      return;
    }

    const days = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    diferencia %= (1000 * 60 * 60 * 24);

    const hours = Math.floor(diferencia / (1000 * 60 * 60));
    diferencia %= (1000 * 60 * 60);

    const minutes = Math.floor(diferencia / (1000 * 60));
    diferencia %= (1000 * 60);

    const seconds = Math.floor(diferencia / 1000);

    this.timeleft = { days, hours, minutes, seconds };
  }

  abrirWhatsapp(){

    this.dataLayer.push({
    event: 'ga_event',
    category: 'foro 2026',
    action: 'AMW - boton whatsapp',
    label: 'resuelve tus dudas'
    });
  const numeroWhatsapp = '573144352014';
  const mensaje = encodeURIComponent('Buen día, tengo una duda con ');
  const url = `https://wa.me/${numeroWhatsapp}?text=${mensaje}`;
  window.open(url, '_blank');
  }


  trackHeader(opcion: string): void {
    this.dataLayer.push({
      event: 'ga_event',
      category: 'foro 2026',
      action: 'AMW - header foro',
      label: opcion
    });
  }

  abrirWhatsappHotel(){
    const numeroWhatsapp = '573204116480';
    const mensaje = encodeURIComponent('Hola. Soy asistente del Foro Experiencia Inmobiliaria, quisiera cotizar habitación con la tarifa preferencial del evento. ¿Podrían compartirme disponibilidad y valores, por favor? ');
    const url = `https://wa.me/${numeroWhatsapp}?text=${mensaje}`;
    window.open(url, '_blank');
  }

    

}


