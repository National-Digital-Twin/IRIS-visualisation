import {
  Injectable,
  inject,
  signal,
  computed,
  Signal,
  WritableSignal,
} from '@angular/core';
import { SettingsKey } from '@core/types/settings-key';
import { SettingsModel } from '@core/models/settings.model';
import { JSONValue } from '@core/types/json-value';
import { Theme } from '@core/types/theme';
import { STORAGE } from '@core/tokens/storage.token';
import { STORAGE_KEY } from '@core/tokens/storage-key.token';

export const SETTINGS = {
  Theme: new SettingsKey<Theme>('theme', 'light', false),
  ColorBlindMode: new SettingsKey<boolean>('color-blind-mode', false, true),
} as const;

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly storage = inject(STORAGE);
  private readonly storageKey = inject(STORAGE_KEY);
  public readonly settings: WritableSignal<SettingsModel>;

  constructor() {
    /* create an empty object but type it as a SettingsModel */
    const settings = {} as SettingsModel;

    for (const key in SETTINGS) {
      const setting = SETTINGS[key as keyof typeof SETTINGS];
      let value = setting.defaultValue;

      /**
      /* if the setting can be stored in local storag and
       * it exsits, set it can the value for the setting
       */
      if (setting.store) {
        const storageKey = `${this.storageKey}-${setting}`;
        const storageString = this.storage.getItem(storageKey);
        if (storageString !== null) {
          value = JSON.parse(storageString);
        }
      }
      settings[setting.key] = value;
    }

    this.settings = signal(settings);
  }

  public set<T extends JSONValue>(
    key: SettingsKey<T>,
    value: T & JSONValue
  ): void {
    this.settings.update(current => ({ ...current, [key.key]: value }));
    if (key.store) {
      const storageKey = `${this.storageKey}-${key}`;
      const storageString = JSON.stringify(value);
      this.storage.setItem(storageKey, storageString);
    }
  }

  public get<T extends JSONValue>(key: SettingsKey<T>): Signal<T> {
    const signal = computed(() => this.settings()[key.key]);
    return signal as Signal<T>;
  }
}
