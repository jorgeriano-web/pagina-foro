import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

interface Particle {
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  size: number;
}

@Component({
  selector: 'app-pago-fallido',
  imports: [],
  templateUrl: './pago-fallido.html',
  styleUrl: './pago-fallido.css',
})
export class PagoFallido implements OnInit, AfterViewInit, OnDestroy {

   @ViewChild('particleCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D | null;
  private particlesArray: Particle[] = [];
  private animationId: number = 0;
  private resizeListener: (() => void) | null = null;

  verificando = true;
  pagoAprobado = false;
  pagoRechazado = false;
  error: string | null = null;
  referencia: string | null = null;

  constructor(private router : Router) {}

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this.initCanvas();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  private initCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    this.resizeListener = () => this.resizeCanvas();
    window.addEventListener('resize', this.resizeListener);

    this.resizeCanvas();
    this.animate();
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.initParticles();
  }

  private initParticles(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    this.particlesArray = [];
    const numberOfParticles = (canvas.height * canvas.width) / 11000;

    for (let i = 0; i < numberOfParticles; i++) {
      const size = (Math.random() * 1.5) + 1;
      const x = Math.random() * (canvas.width - size * 2) + size * 2;
      const y = Math.random() * (canvas.height - size * 2) + size * 2;
      const directionX = (Math.random() * 0.4) - 0.2;
      const directionY = (Math.random() * 0.4) - 0.2;

      this.particlesArray.push({ x, y, directionX, directionY, size });
    }
  }

  private drawParticle(particle: Particle): void {
    if (!this.ctx) return;

    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2, false);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fill();
  }

  private updateParticle(particle: Particle): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    if (particle.x > canvas.width || particle.x < 0) {
      particle.directionX = -particle.directionX;
    }
    if (particle.y > canvas.height || particle.y < 0) {
      particle.directionY = -particle.directionY;
    }

    particle.x += particle.directionX;
    particle.y += particle.directionY;

    this.drawParticle(particle);
  }

  private connectParticles(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.ctx) return;

    for (let a = 0; a < this.particlesArray.length; a++) {
      for (let b = a; b < this.particlesArray.length; b++) {
        const distance =
          Math.pow(this.particlesArray[a].x - this.particlesArray[b].x, 2) +
          Math.pow(this.particlesArray[a].y - this.particlesArray[b].y, 2);

        if (distance < (canvas.width / 8) * (canvas.height / 8)) {
          const opacityValue = 1 - (distance / 20000);
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacityValue * 0.3})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particlesArray[a].x, this.particlesArray[a].y);
          this.ctx.lineTo(this.particlesArray[b].x, this.particlesArray[b].y);
          this.ctx.stroke();
        }
      }
    }
  }

  private animate(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.ctx) return;

    this.animationId = requestAnimationFrame(() => this.animate());
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const particle of this.particlesArray) {
      this.updateParticle(particle);
    }

    this.connectParticles();
  }

  finalizar(): void {
    this.router.navigate([''])
  }
}
