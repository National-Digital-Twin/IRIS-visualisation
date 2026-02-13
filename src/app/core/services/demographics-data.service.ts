import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { FeatureCollection, Geometry } from 'geojson';
import { Observable } from 'rxjs';

export interface DeprivationLayerProperties {
    area_nm?: string;
    dep_3?: number;
    dep_4?: number;
    dep_pct_0?: number;
    dep_pct_1?: number;
    dep_pct_2?: number;
    dep_pct_3?: number;
    dep_pct_4: number;
}

@Injectable({ providedIn: 'root' })
export class DemographicsDataService {
    readonly #http = inject(HttpClient);

    public getDeprivationLayerData(): Observable<FeatureCollection<Geometry, DeprivationLayerProperties>> {
        return this.#http.get<FeatureCollection<Geometry, DeprivationLayerProperties>>(`/api/data/demographics/deprivation`);
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
