import { TestBed } from '@angular/core/testing';
import { EPC_DATA_FILE_NAME, SAP_DATA_FILE_NAME, NON_EPC_DATA_FILE_NAME } from './cache.token';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

describe('Cache Tokens', () => {
  const runtimeConfiguration = {
    cache: {
      epc: 'epc-data.json',
      sap: 'SAP-data.json',
      nonEpc: 'non-epc-data.json',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: RUNTIME_CONFIGURATION, useValue: runtimeConfiguration }
      ],
    });
  });

  it('should resolve EPC_DATA_FILE_NAME to the correct value', () => {
    const epcFileName = TestBed.inject(EPC_DATA_FILE_NAME);
    expect(epcFileName).toBe(runtimeConfiguration.cache.epc);
  });

  it('should resolve SAP_DATA_FILE_NAME to the correct value', () => {
    const sapFileName = TestBed.inject(SAP_DATA_FILE_NAME);
    expect(sapFileName).toBe(runtimeConfiguration.cache.sap);
  });

  it('should resolve NON_EPC_DATA_FILE_NAME to the correct value', () => {
    const nonEpcFileName = TestBed.inject(NON_EPC_DATA_FILE_NAME);
    expect(nonEpcFileName).toBe(runtimeConfiguration.cache.nonEpc);
  });
});
