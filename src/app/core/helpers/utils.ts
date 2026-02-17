import { BuiltForm, EPCRating } from '@core/enums';

/**
 * Parse EPC rating from string to enum
 */
export function parseEPCRating(epcValue?: string): EPCRating {
    if (!epcValue) return EPCRating.none;

    if (/^[A-G]$/i.test(epcValue)) {
        const rating = epcValue.toUpperCase() as keyof typeof EPCRating;
        return EPCRating[rating] || EPCRating.none;
    }

    return EPCRating.none;
}

export function parsePostcode(postcode: string): string {
    const postcodePartMatch = /^[A-Z0-9]{3,4}/.exec(postcode);
    if (postcodePartMatch?.[0]) {
        return postcodePartMatch[0];
    }

    return '';
}

export function parseBuiltForm(builtForm: string | undefined): string | undefined {
    if (builtForm) {
        const parsedBuiltForm = BuiltForm[builtForm as keyof typeof BuiltForm];
        return parsedBuiltForm?.replaceAll(' ', '');
    }

    return undefined;
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
