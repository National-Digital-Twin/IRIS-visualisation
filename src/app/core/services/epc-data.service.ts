import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { FeatureCollection, Geometry } from 'geojson';
import { Observable } from 'rxjs';

export interface EPCWardsProperties {
    name: string;
    epc_a: number;
    epc_b: number;
    epc_c: number;
    epc_d: number;
    epc_e: number;
    epc_f: number;
    epc_g: number;
    total: number;
    epc_null: number;
}

export type EPCType = 'region' | 'county' | 'district' | 'ward';

@Injectable({ providedIn: 'root' })
export class EPCDataService {
    readonly #http = inject(HttpClient);

    public getEPCData(type: EPCType): Observable<FeatureCollection<Geometry, EPCWardsProperties>> {
        const endpoint = this.getEndpointForType(type);
        return this.#http.get<FeatureCollection<Geometry, EPCWardsProperties>>(endpoint);
    }

    private getEndpointForType(type: EPCType): string {
        const endpoints = {
            region: '/api/data/energy-performance/regions',
            county: '/api/data/energy-performance/counties',
            district: '/api/data/energy-performance/districts',
            ward: '/api/data/energy-performance/wards',
        };
        return endpoints[type];
    }
}
