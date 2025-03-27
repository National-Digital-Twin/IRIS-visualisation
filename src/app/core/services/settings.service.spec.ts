import { TestBed } from '@angular/core/testing';
import { STORAGE_KEY } from '@core/tokens/storage-key.token';
import { STORAGE } from '@core/tokens/storage.token';
import { SETTINGS, SettingsService } from './settings.service';

describe('SettingsService', () => {
    const STORAGE_KEY_VALUE = 'c477-settings';
    let service: SettingsService;
    let mockLocalStorage: {
        getItem: jest.Mock;
        setItem: jest.Mock;
    };

    beforeEach(() => {
        mockLocalStorage = {
            getItem: jest.fn().mockReturnValue(null),
            setItem: jest.fn(),
        };

        TestBed.configureTestingModule({
            providers: [SettingsService, { provide: STORAGE, useValue: mockLocalStorage }, { provide: STORAGE_KEY, useValue: STORAGE_KEY_VALUE }],
        });

        service = TestBed.inject(SettingsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('constructor', () => {
        it('should initialize settings with default values', () => {
            expect(service.settings()).toEqual({
                'theme': 'light',
                'color-blind-mode': false,
            });
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith(`${STORAGE_KEY_VALUE}-color-blind-mode`);
        });
    });

    describe('set', () => {
        it('should update the settings value if colourblind is enabled', () => {
            service.set(SETTINGS.ColorBlindMode, true);
            expect(service.settings()).toEqual({
                'theme': 'light',
                'color-blind-mode': true,
            });
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(`${STORAGE_KEY_VALUE}-color-blind-mode`, JSON.stringify(true));
        });

        it('should update the settings value if theme is dark', () => {
            service.set(SETTINGS.Theme, 'dark');
            expect(service.settings()).toEqual({
                'theme': 'dark',
                'color-blind-mode': false,
            });
            expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(`${STORAGE_KEY_VALUE}-theme`, expect.anything());
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
