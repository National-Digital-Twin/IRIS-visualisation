import { JSONValue } from '@core/types/json-value';

export class SettingsKey<T extends JSONValue> {
  constructor(
    public readonly key: string,
    public readonly defaultValue: T,
    public readonly store: boolean
  ) {}
}
