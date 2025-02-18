import { TestBed } from '@angular/core/testing';
import { STORAGE_KEY } from './storage-key.token';

describe('STORAGE_KEY token', () => {
  it('should resolve to "c477-settings"', () => {
    TestBed.configureTestingModule({});
    const storageKey = TestBed.inject(STORAGE_KEY);
    expect(storageKey).toBe('c477-settings');
  });
});
