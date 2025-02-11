import { InjectionToken } from '@angular/core';
import { RuntimeConfigurationModel } from '@core/models/runtime-configuration.model';

/**
 * Runtime Configuration.
 *
 * The configuration that is loaded at runtime.
 */
export const RUNTIME_CONFIGURATION = new InjectionToken<RuntimeConfigurationModel>('RUNTIME_CONFIGURATION');
