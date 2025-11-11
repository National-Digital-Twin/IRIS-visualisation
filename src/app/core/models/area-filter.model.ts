export type AreaLevel = 'region' | 'county' | 'district' | 'ward';

export type AreaFilter = { mode: 'polygon'; polygon: GeoJSON.Polygon } | { mode: 'named-areas'; level: AreaLevel; names: string[] };

export interface AreaSelectionDialogResult {
    level: AreaLevel;
    names: string[];
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
