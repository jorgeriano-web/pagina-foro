import { TestBed } from '@angular/core/testing';

import { ServiceBoletas } from './service-boletas';

describe('ServiceBoletas', () => {
  let service: ServiceBoletas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceBoletas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
