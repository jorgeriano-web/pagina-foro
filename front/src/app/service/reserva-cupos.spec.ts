import { TestBed } from '@angular/core/testing';

import { ReservaCupos } from './reserva-cupos';

describe('ReservaCupos', () => {
  let service: ReservaCupos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReservaCupos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
