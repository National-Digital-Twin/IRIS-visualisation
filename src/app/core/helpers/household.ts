export function formatHouseholdCount(value: number | undefined): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '0';
    }

    return value.toLocaleString('en-GB');
}

export function getPluralSuffix(value: number | undefined): '' | 's' {
    return isSingleHousehold(value) ? '' : 's';
}

export function getHouseholdVerb(value: number | undefined): 'is' | 'are' {
    return isSingleHousehold(value) ? 'is' : 'are';
}

function isSingleHousehold(value: number | undefined): boolean {
    return typeof value === 'number' && !Number.isNaN(value) && value === 1;
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
