import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroNoCliente } from './registro-no-cliente';

describe('RegistroNoCliente', () => {
  let component: RegistroNoCliente;
  let fixture: ComponentFixture<RegistroNoCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroNoCliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroNoCliente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
