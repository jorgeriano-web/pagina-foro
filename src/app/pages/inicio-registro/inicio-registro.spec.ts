import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InicioRegistro } from './inicio-registro';

describe('InicioRegistro', () => {
  let component: InicioRegistro;
  let fixture: ComponentFixture<InicioRegistro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioRegistro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InicioRegistro);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
