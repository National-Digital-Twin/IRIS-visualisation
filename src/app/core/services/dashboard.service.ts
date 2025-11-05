import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface RegionCharacteristicData {
    region_name: string;
    percentage: number;
}

export interface BuildingCharacteristicsResponse {
    characteristic: string;
    regions: RegionCharacteristicData[];
}

export interface TimelineAvgSAPDataPoint {
    date: Date;
    national_avg_sap_rating: number;
    filtered_avg_sap_rating: number | null;
}

export interface SAPTimelineResponse {
    timeline: TimelineAvgSAPDataPoint[];
}

export interface EPCRegionData {
    region_name: string;
    epc_a: number;
    epc_b: number;
    epc_c: number;
    epc_d: number;
    epc_e: number;
    epc_f: number;
    epc_g: number;
    total: number;
}

export interface EPCRatingTotal {
    rating: string;
    count: number;
}

export interface OverallEPCResponse {
    total: number;
    ratings: EPCRatingTotal[];
}

export interface BackendBuildingAttributesResponse {
    region_name: string;
    percentage_roof_solar_panels: number;
    percentage_double_glazing: number;
    percentage_single_glazing: number;
    percentage_solid_floor: number;
    percentage_roof_insulation_thickness_150mm: number;
    percentage_roof_insulation_thickness_200mm: number;
    percentage_roof_insulation_thickness_250mm: number;
    percentage_pitched_roof: number;
    percentage_cavity_wall: number;
}

export interface BackendFuelTypesByBuildingTypeResponse {
    building_type: string;
    fuel_type: string;
    count: number;
}

interface BackendSAPTimelineResponse {
    date: string;
    national_avg_sap_rating: number;
    filtered_avg_sap_rating: number | null;
}

export interface BackendBuildingsAffectedByExtremeWeatherResponse {
    number_of_buildings: number;
    affected_by_icing_days?: boolean;
    affected_by_hsds?: boolean;
    affected_by_wdr?: boolean;
}

export interface BackendNumberOfInDateAndExpiredEpcsResponse {
    year: Date;
    expired: number;
    active: number;
}

interface BackendEPCRegionData {
    region_name: string;
    epc_a: number;
    epc_b: number;
    epc_c: number;
    epc_d: number;
    epc_e: number;
    epc_f: number;
    epc_g: number;
}

interface BackendEPCRatings {
    epc_a: number;
    epc_b: number;
    epc_c: number;
    epc_d: number;
    epc_e: number;
    epc_f: number;
    epc_g: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    readonly #http = inject(HttpClient);
    readonly #endpointRoot = '/api/dashboard';

    private readonly REGION_NAME_MAP: Record<string, string> = {
        'Eastern English Region': 'East of England',
        'East Midlands English Region': 'East Midlands',
        'London English Region': 'London',
        'North East English Region': 'North East',
        'North West English Region': 'North West',
        'South East English Region': 'South East',
        'South West English Region': 'South West',
        'West Midlands English Region': 'West Midlands',
        'Yorkshire and the Humber English Region': 'Yorkshire & Humber',
        'Mid and West Wales PER': 'Mid and West Wales',
        'North Wales PER': 'North Wales',
        'South Wales Central PER': 'South Wales Central',
        'South Wales East PER': 'South Wales East',
        'South Wales West PER': 'South Wales West',
    };

    private getParamsWithPolygon(polygon?: GeoJSON.Polygon): Record<string, string> {
        const params: Record<string, string> = {};
        if (polygon) {
            params.polygon = JSON.stringify(polygon);
        }

        return params;
    }

    public getAllBuildingAttributesPerRegion(polygon?: GeoJSON.Polygon): Observable<BackendBuildingAttributesResponse[]> {
        return this.#http
            .get<
                BackendBuildingAttributesResponse[]
            >(`${this.#endpointRoot}/building-attributes-percentage-per-region`, { params: this.getParamsWithPolygon(polygon), withCredentials: true })
            .pipe(
                map((results) =>
                    results.map((data) => ({
                        ...data,
                        region_name: this.REGION_NAME_MAP[data.region_name] || data.region_name,
                    })),
                ),
            );
    }

    public getSAPTimeline(polygon?: GeoJSON.Polygon): Observable<SAPTimelineResponse> {
        return this.#http
            .get<
                BackendSAPTimelineResponse[]
            >(`${this.#endpointRoot}/sap-rating-overtime`, { params: this.getParamsWithPolygon(polygon), withCredentials: true })
            .pipe(
                map((results) => ({
                    timeline: results.map((data) => ({
                        date: new Date(data.date),
                        national_avg_sap_rating: data.national_avg_sap_rating,
                        filtered_avg_sap_rating: data.filtered_avg_sap_rating,
                    })),
                })),
            );
    }

    public getEPCByRegion(polygon?: GeoJSON.Polygon): Observable<EPCRegionData[]> {
        return this.#http
            .get<BackendEPCRegionData[]>(`${this.#endpointRoot}/epc-ratings-per-region`, { params: this.getParamsWithPolygon(polygon), withCredentials: true })
            .pipe(
                map((results) =>
                    results.map((data) => ({
                        region_name: this.REGION_NAME_MAP[data.region_name] || data.region_name,
                        epc_a: data.epc_a,
                        epc_b: data.epc_b,
                        epc_c: data.epc_c,
                        epc_d: data.epc_d,
                        epc_e: data.epc_e,
                        epc_f: data.epc_f,
                        epc_g: data.epc_g,
                        total: data.epc_a + data.epc_b + data.epc_c + data.epc_d + data.epc_e + data.epc_f + data.epc_g,
                    })),
                ),
            );
    }

    public getOverallEPC(polygon?: GeoJSON.Polygon): Observable<OverallEPCResponse> {
        return this.#http
            .get<BackendEPCRatings[]>(`${this.#endpointRoot}/epc-ratings`, { params: this.getParamsWithPolygon(polygon), withCredentials: true })
            .pipe(
                map((results) => {
                    const data = results[0];
                    const total = data.epc_a + data.epc_b + data.epc_c + data.epc_d + data.epc_e + data.epc_f + data.epc_g;

                    return {
                        total,
                        ratings: [
                            { rating: 'A', count: data.epc_a },
                            { rating: 'B', count: data.epc_b },
                            { rating: 'C', count: data.epc_c },
                            { rating: 'D', count: data.epc_d },
                            { rating: 'E', count: data.epc_e },
                            { rating: 'F', count: data.epc_f },
                            { rating: 'G', count: data.epc_g },
                        ],
                    };
                }),
            );
    }

    public getFuelTypesByBuildingType(polygon?: GeoJSON.Polygon): Observable<BackendFuelTypesByBuildingTypeResponse[]> {
        return this.#http.get<BackendFuelTypesByBuildingTypeResponse[]>(`${this.#endpointRoot}/fuel-types-by-building-type`, {
            params: this.getParamsWithPolygon(polygon),
            withCredentials: true,
        });
    }

    public getBuildingsAffectedByExtremeWeather(): Observable<BackendBuildingsAffectedByExtremeWeatherResponse[]> {
        return this.#http.get<BackendBuildingsAffectedByExtremeWeatherResponse[]>(`${this.#endpointRoot}/buildings-affected-by-extreme-weather`, {
            withCredentials: true,
        });
    }

    public getNumberOfInDateAndExpiredEpcs(): Observable<BackendNumberOfInDateAndExpiredEpcsResponse[]> {
        return this.#http.get<BackendNumberOfInDateAndExpiredEpcsResponse[]>(`${this.#endpointRoot}/no-of-in-date-and-expired-epcs`, { withCredentials: true });
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
