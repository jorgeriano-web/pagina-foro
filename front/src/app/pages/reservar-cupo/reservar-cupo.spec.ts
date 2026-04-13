import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservarCupo } from './reservar-cupo';

describe('ReservarCupo', () => {
  let component: ReservarCupo;
  let fixture: ComponentFixture<ReservarCupo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservarCupo],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservarCupo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
