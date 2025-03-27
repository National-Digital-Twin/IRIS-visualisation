import { inject, InjectionToken } from '@angular/core';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

function epcDataFileNameFactory(): string {
    return inject(RUNTIME_CONFIGURATION).cache.epc;
}

function sapDataFileNameFactory(): string {
    return inject(RUNTIME_CONFIGURATION).cache.sap;
}

function nonEpcDataFileNameFactory(): string {
    return inject(RUNTIME_CONFIGURATION).cache.nonEpc;
}

export const EPC_DATA_FILE_NAME = new InjectionToken<string>('EPC_DATA_FILE_NAME', { factory: epcDataFileNameFactory });

export const SAP_DATA_FILE_NAME = new InjectionToken<string>('SAP_DATA_FILE_NAME', { factory: sapDataFileNameFactory });

export const NON_EPC_DATA_FILE_NAME = new InjectionToken<string>('NON_EPC_DATA_FILE_NAME', { factory: nonEpcDataFileNameFactory });

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
