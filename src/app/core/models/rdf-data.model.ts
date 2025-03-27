export interface TableRow {
    [key: string]: string;
}

export interface RDFObject {
    type: string;
    value: string;
}

export interface RDFData {
    [key: string]: RDFObject;
}

export interface SPARQLReturn {
    head: {
        vars: string[];
    };
    results: {
        bindings: RDFData[];
    };
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
