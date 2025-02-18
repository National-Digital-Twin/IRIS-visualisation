import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { STORAGE } from './storage.token';

describe('STORAGE token', () => {
  it('should resolve to localStorage from the injected DOCUMENT', () => {
    const fakeLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      key: jest.fn(),
      length: 0,
    } as unknown as Storage;

    const fakeDocument = {
      defaultView: {
        localStorage: fakeLocalStorage,
      },
    };

    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: fakeDocument }],
    });

    const storage = TestBed.inject(STORAGE);
    expect(storage).toBe(fakeLocalStorage);
  });
});
