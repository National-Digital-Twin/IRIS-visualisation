import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BoundingBox } from '@core/models';
import { Observable } from 'rxjs';

export type BuildingDetail = {
    uri: null;
    securityLabel: null;
    types: [];
    uprn: string;
    longitude: number;
    latitude: number;
    structure_unit_type: null;
    postcode: string;
    lodgement_date: string;
    built_form: null;
    floor_construction: string;
    floor_insulation: string;
    roof_construction: string;
    roof_insulation_location: string;
    roof_insulation_thickness: string;
    wall_construction: string;
    wall_insulation: string;
    window_glazing: string;
};

@Injectable({ providedIn: 'root' })
export class BuildingService {
    #http = inject(HttpClient);

    public retrieveDetailedBuildings(boundingBox: BoundingBox): Observable<BuildingDetail[]> {
        let params = new HttpParams();
        params = params.set('max_lat', boundingBox.maxX);
        params = params.set('min_lat', boundingBox.minX);
        params = params.set('min_long', boundingBox.minY);
        params = params.set('max_long', boundingBox.maxY);

        return this.#http.get<BuildingDetail[]>('/api/detailed-buildings', { params });
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
