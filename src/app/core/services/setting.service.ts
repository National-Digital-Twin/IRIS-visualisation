import { Injectable, inject, signal } from '@angular/core';
import { DEFAULT_SETTINGS } from '@core/tokens/default-settings.token';
import { STORAGE } from '@core/tokens/storage.token';
import { STORAGE_KEY } from '@core/tokens/storage-key.token';

type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

export type SettingsModel = { [key: string]: JSONValue };

@Injectable({ providedIn: 'root' })
export class SettingService {
  private readonly storage = inject(STORAGE);
  private readonly storageKey = inject(STORAGE_KEY);
  public readonly settings = signal(inject(DEFAULT_SETTINGS));

  constructor() {
    const settings = this.storage.getItem(this.storageKey);
    if (settings) {
      this.settings.update(current => ({
        ...current,
        ...JSON.parse(settings),
      }));
    }
  }

  public set(key: string, value: JSONValue) {
    const settings = this.settings();
    if (key in settings) {
      settings[key] = value;
      this.settings.update(current => ({ ...current, ...settings }));
      this.storage.setItem(this.storageKey, JSON.stringify(settings));
    }
  }
}
