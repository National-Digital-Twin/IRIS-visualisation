import { JSONValue } from '@core/types/json-value';

export class SettingsKey<T extends JSONValue> {
    constructor(
        public readonly key: string,
        public readonly defaultValue: T,
        public readonly store: boolean,
    ) {}
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
