import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AreaLevel } from '../models/area-filter.model';

@Injectable({ providedIn: 'root' })
export class AreaSelectionService {
    readonly #http = inject(HttpClient);
    readonly #endpointRoot = '/api/areas';

    public getRegions(): Observable<string[]> {
        return this.#http.get<string[]>(`${this.#endpointRoot}/regions`);
    }

    public getCounties(): Observable<string[]> {
        return this.#http.get<string[]>(`${this.#endpointRoot}/counties`);
    }

    public getDistricts(): Observable<string[]> {
        return this.#http.get<string[]>(`${this.#endpointRoot}/districts`);
    }

    public getWards(): Observable<string[]> {
        return this.#http.get<string[]>(`${this.#endpointRoot}/wards`);
    }

    public getAreasByLevel(level: AreaLevel): Observable<string[]> {
        switch (level) {
            case 'region':
                return this.getRegions();
            case 'county':
                return this.getCounties();
            case 'district':
                return this.getDistricts();
            case 'ward':
                return this.getWards();
        }
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
