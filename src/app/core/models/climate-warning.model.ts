export interface ClimateWarningModel {
    propertyId: string;
    address: {
        streetNumber: string;
        streetName: string;
        city: string;
        postcode: string;
    };
    epc: {
        rating: string;
        score: number;
    };
    warnings: ClimateWarning[];
}

export interface ClimateWarning {
    id: string;
    title: string;
    summary: string;
    data?: ClimateWarningData;
}

export interface ClimateWarningData {
    type: 'table' | 'list';
    headers?: string[];
    values?: (string | number)[][] | ListItem[];
}

export interface ListItem {
    label: string;
    value: string | number;
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
