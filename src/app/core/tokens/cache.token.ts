import { inject, InjectionToken } from '@angular/core';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

/**
 * EPC Data File Name Factory.
 *
 * Factory function to create a file name string.
 */
function epcDataFileNameFactory(): string {
    return inject(RUNTIME_CONFIGURATION).cache.epc;
}
/**
 * SAP Data File Name Factory.
 *
 * Factory function to create a file name string.
 */
function sapDataFileNameFactory(): string {
    return inject(RUNTIME_CONFIGURATION).cache.sap;
}
/**
 * Non-EPC Data File Name Factory.
 *
 * Factory function to create a file name string.
 */
function nonEpcDataFileNameFactory(): string {
    return inject(RUNTIME_CONFIGURATION).cache.nonEpc;
}

/**
 * EPC data file name.
 *
 * The file name string.
 */
export const EPC_DATA_FILE_NAME = new InjectionToken<string>('EPC_DATA_FILE_NAME', { factory: epcDataFileNameFactory });

/**
 * SAP data file name.
 *
 * The file name string.
 */
export const SAP_DATA_FILE_NAME = new InjectionToken<string>('SAP_DATA_FILE_NAME', { factory: sapDataFileNameFactory });

/**
 * Non-EPC data file name.
 *
 * The file name string.
 */
export const NON_EPC_DATA_FILE_NAME = new InjectionToken<string>('NON_EPC_DATA_FILE_NAME', { factory: nonEpcDataFileNameFactory });
