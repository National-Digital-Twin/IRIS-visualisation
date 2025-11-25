import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AreaFilter, AreaLevel } from '../models/area-filter.model';

interface EPCRatings {
    epc_a: number;
    epc_b: number;
    epc_c: number;
    epc_d: number;
    epc_e: number;
    epc_f: number;
    epc_g: number;
}

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

export interface EPCRatingsByCategory extends EPCRatings {
    name: string;
    total: number;
}

export type EPCAreaData = EPCRatingsByCategory;

export interface EPCRatingTotal {
    rating: string;
    count: number;
}

export interface OverallEPCResponse {
    total: number;
    ratings: EPCRatingTotal[];
}

export interface BuildingAttributeItem {
    label: string;
    value: number;
}

export interface BackendBuildingAttributesResponse {
    region_name: string;
    attributes: BuildingAttributeItem[];
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
    filtered_number_of_buildings?: number;
    affected_by_icing_days?: boolean;
    affected_by_hsds?: boolean;
    affected_by_wdr?: boolean;
}

export interface BackendNumberOfInDateAndExpiredEpcsResponse {
    year: Date;
    expired: number;
    active: number;
}

interface BackendEPCAreaData extends EPCRatings {
    name: string;
    total: number;
}

interface BackendEpcRatingsOvertimeResponse extends EPCRatings {
    date: string;
}

export interface EPCRatingOvertimeDataPoint extends EPCRatings {
    date: Date;
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

    private getParamsWithFilter(filter?: AreaFilter): Record<string, string | string[]> {
        switch (filter?.mode) {
            case 'polygon':
                return { polygon: JSON.stringify(filter.polygon) };
            case 'named-areas':
                return { area_level: filter.level, area_names: filter.names };
            default:
                return {};
        }
    }

    public getAllBuildingAttributesPerRegion(filter?: AreaFilter): Observable<BackendBuildingAttributesResponse[]> {
        return this.#http
            .get<
                BackendBuildingAttributesResponse[]
            >(`${this.#endpointRoot}/building-attributes-percentage-per-region`, { params: this.getParamsWithFilter(filter), withCredentials: true })
            .pipe(
                map((results) =>
                    results.map((data) => ({
                        ...data,
                        region_name: this.REGION_NAME_MAP[data.region_name] || data.region_name,
                    })),
                ),
            );
    }

    public getSAPTimeline(filter?: AreaFilter): Observable<SAPTimelineResponse> {
        return this.#http
            .get<BackendSAPTimelineResponse[]>(`${this.#endpointRoot}/sap-rating-overtime`, { params: this.getParamsWithFilter(filter), withCredentials: true })
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

    public getEPCRatingsOvertime(filter?: AreaFilter): Observable<EPCRatingOvertimeDataPoint[]> {
        return this.#http
            .get<
                BackendEpcRatingsOvertimeResponse[]
            >(`${this.#endpointRoot}/epc-ratings-overtime`, { params: this.getParamsWithFilter(filter), withCredentials: true })
            .pipe(map((results) => results.map((item) => ({ ...item, date: new Date(item.date) }))));
    }

    public getEPCByAreaLevel(groupBy: AreaLevel, filterLevel?: AreaLevel, filterNames?: string[]): Observable<EPCAreaData[]> {
        const params: Record<string, string | string[]> = {
            group_by_level: groupBy,
        };

        if (filterLevel && filterNames) {
            params['filter_area_level'] = filterLevel;
            params['filter_area_names'] = filterNames;
        }

        return this.#http.get<BackendEPCAreaData[]>(`${this.#endpointRoot}/epc-ratings-by-area-level`, { params, withCredentials: true });
    }

    public getOverallEPC(filter?: AreaFilter): Observable<OverallEPCResponse> {
        return this.#http.get<EPCRatings[]>(`${this.#endpointRoot}/epc-ratings`, { params: this.getParamsWithFilter(filter), withCredentials: true }).pipe(
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

    public getFuelTypesByBuildingType(filter?: AreaFilter): Observable<BackendFuelTypesByBuildingTypeResponse[]> {
        return this.#http.get<BackendFuelTypesByBuildingTypeResponse[]>(`${this.#endpointRoot}/fuel-types-by-building-type`, {
            params: this.getParamsWithFilter(filter),
            withCredentials: true,
        });
    }

    public getBuildingsAffectedByExtremeWeather(filter?: AreaFilter): Observable<BackendBuildingsAffectedByExtremeWeatherResponse[]> {
        return this.#http.get<BackendBuildingsAffectedByExtremeWeatherResponse[]>(`${this.#endpointRoot}/buildings-affected-by-extreme-weather`, {
            params: this.getParamsWithFilter(filter),
            withCredentials: true,
        });
    }

    public getNumberOfInDateAndExpiredEpcs(filter?: AreaFilter): Observable<BackendNumberOfInDateAndExpiredEpcsResponse[]> {
        return this.#http.get<BackendNumberOfInDateAndExpiredEpcsResponse[]>(`${this.#endpointRoot}/no-of-in-date-and-expired-epcs`, {
            params: this.getParamsWithFilter(filter),
            withCredentials: true,
        });
    }

    public getEPCByFeature(feature: string, filter?: AreaFilter): Observable<EPCRatingsByCategory[]> {
        const params = this.getParamsWithFilter(filter);
        params['feature'] = feature;

        return this.#http.get<EPCRatingsByCategory[]>(`${this.#endpointRoot}/epc-ratings-by-feature`, {
            params,
            withCredentials: true,
        });
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
