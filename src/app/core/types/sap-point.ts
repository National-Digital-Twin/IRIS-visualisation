export type SAPPoint = {
    UPRN: string;
    TOID?: string;
    SAPPoint: string;
    ParentTOID?: string;
    longitude: string;
    latitude: string;
};

export type SAPPointMap = {
    [key: string]: SAPPoint[];
};

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
