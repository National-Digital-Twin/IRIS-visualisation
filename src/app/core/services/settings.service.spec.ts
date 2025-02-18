import { TestBed } from '@angular/core/testing';
import { SettingsService, SETTINGS } from './settings.service';
import { STORAGE } from '@core/tokens/storage.token';
import { STORAGE_KEY } from '@core/tokens/storage-key.token';

describe('SettingsService', () => {
  let service: SettingsService;
  let fakeLocalStorage: {
    getItem: jest.Mock;
    setItem: jest.Mock;
  };

  const STORAGE_KEY_VALUE = 'c477-settings';

  beforeEach(() => {
    fakeLocalStorage = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        { provide: STORAGE, useValue: fakeLocalStorage },
        { provide: STORAGE_KEY, useValue: STORAGE_KEY_VALUE },
      ],
    });
    service = TestBed.inject(SettingsService);
  });

  describe('constructor', () => {
    it('should initialize settings with default values when no stored value exists', () => {
      // SETTINGS defines:
      // - Theme: default 'light' (store: false)
      // - ColorBlindMode: default false (store: true)
      expect(service.settings()).toEqual({
        theme: 'light',
        'color-blind-mode': false,
      });
      expect(fakeLocalStorage.getItem).toHaveBeenCalledWith(`${STORAGE_KEY_VALUE}-color-blind-mode`);
    });
  });

  describe('set', () => {
    it('should update the setting value and store it if store is true', () => {
      // For ColorBlindMode (store: true)
      service.set(SETTINGS.ColorBlindMode, true);
      expect(service.settings()).toEqual({
        theme: 'light',
        'color-blind-mode': true,
      });
      expect(fakeLocalStorage.setItem).toHaveBeenCalledWith(
        `${STORAGE_KEY_VALUE}-color-blind-mode`,
        JSON.stringify(true)
      );
    });

    it('should update the setting value without storing if store is false', () => {
      // For Theme (store: false)
      service.set(SETTINGS.Theme, 'dark');
      expect(service.settings()).toEqual({
        theme: 'dark',
        'color-blind-mode': false,
      });
      expect(fakeLocalStorage.setItem).not.toHaveBeenCalledWith(
        `${STORAGE_KEY_VALUE}-theme`,
        expect.anything()
      );
    });
  });

  describe('get', () => {
    it('should return a computed signal that reflects the current value', () => {
      const themeSignal = service.get(SETTINGS.Theme);
      expect(themeSignal()).toBe('light');
      service.set(SETTINGS.Theme, 'dark');
      expect(themeSignal()).toBe('dark');
    });
  });
});
