import { computed, inject, Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { SettingsModel } from '@core/models/settings.model';
import { STORAGE_KEY } from '@core/tokens/storage-key.token';
import { STORAGE } from '@core/tokens/storage.token';
import { JSONValue } from '@core/types/json-value';
import { SettingsKey } from '@core/types/settings-key';
import { Theme } from '@core/types/theme';

export const SETTINGS = {
    Theme: new SettingsKey<Theme>('theme', 'light', false),
    ColorBlindMode: new SettingsKey<boolean>('color-blind-mode', false, true),
} as const;

@Injectable({ providedIn: 'root' })
export class SettingsService {
    readonly #storage = inject(STORAGE);
    readonly #storageKey = inject(STORAGE_KEY);

    public settings: WritableSignal<SettingsModel>;

    constructor() {
        const settings = {} as SettingsModel;

        for (const key in SETTINGS) {
            const setting = SETTINGS[key as keyof typeof SETTINGS];
            let value = setting.defaultValue;

            if (setting.store) {
                const storageKey = `${this.#storageKey}-${setting.key}`;
                const storageString = this.#storage.getItem(storageKey);
                if (storageString !== null) {
                    value = JSON.parse(storageString);
                }
            }
            settings[setting.key] = value;
        }

        this.settings = signal(settings);
    }

    public set<T extends JSONValue>(setting: SettingsKey<T>, value: T & JSONValue): void {
        this.settings.update((current) => ({ ...current, [setting.key]: value }));
        if (setting.store) {
            const storageKey = `${this.#storageKey}-${setting.key}`;
            const storageString = JSON.stringify(value);
            this.#storage.setItem(storageKey, storageString);
        }
    }

    public get<T extends JSONValue>(key: SettingsKey<T>): Signal<T> {
        const signal = computed(() => this.settings()[key.key]);
        return signal as Signal<T>;
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
