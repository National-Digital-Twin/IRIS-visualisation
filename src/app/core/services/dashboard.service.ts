import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface RegionCharacteristicData {
    region_name: string;
    percentage: number;
}

export interface BuildingCharacteristicsResponse {
    characteristic: string;
    regions: RegionCharacteristicData[];
}

export interface TimelineDataPoint {
    date: Date;
    avg_sap_score: number;
}

export interface SAPTimelineResponse {
    timeline: TimelineDataPoint[];
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

interface BackendBuildingAttributesResponse {
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

interface BackendSAPTimelineResponse {
    lodgement_date: string;
    avg_sap_score: number;
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

    public getBuildingCharacteristics(characteristic: string): Observable<BuildingCharacteristicsResponse> {
        const characteristicFieldMap: Record<string, string> = {
            'solar panels': 'percentage_roof_solar_panels',
            'double glazing': 'percentage_double_glazing',
            'single glazing': 'percentage_single_glazing',
            'cavity wall': 'percentage_cavity_wall',
            'pitched roof': 'percentage_pitched_roof',
            'solid floor': 'percentage_solid_floor',
            'roof insulation 150mm': 'percentage_roof_insulation_thickness_150mm',
            'roof insulation 200mm': 'percentage_roof_insulation_thickness_200mm',
            'roof insulation 250mm': 'percentage_roof_insulation_thickness_250mm',
        };

        const fieldName = characteristicFieldMap[characteristic.toLowerCase()];

        if (!fieldName) {
            return of({ characteristic, regions: [] });
        }

        return this.#http.get<BackendBuildingAttributesResponse[]>('/api/dashboard/building-attributes-percentage', { withCredentials: true }).pipe(
            map((results) => ({
                characteristic,
                regions: results.map((data) => ({
                    region_name: this.REGION_NAME_MAP[data.region_name] || data.region_name,
                    percentage: (data[fieldName as keyof BackendBuildingAttributesResponse] as number) || 0,
                })),
            })),
        );
    }

    public getSAPTimeline(): Observable<SAPTimelineResponse> {
        return this.#http.get<BackendSAPTimelineResponse[]>('/api/dashboard/sap-score-overtime', { withCredentials: true }).pipe(
            map((results) => ({
                timeline: results.map((data) => ({
                    date: new Date(data.lodgement_date),
                    avg_sap_score: data.avg_sap_score,
                })),
            })),
        );
    }

    public getEPCByRegion(): Observable<EPCRegionData[]> {
        return this.#http.get<BackendEPCRegionData[]>('/api/dashboard/epc-ratings-per-region', { withCredentials: true }).pipe(
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

    public getOverallEPC(): Observable<OverallEPCResponse> {
        return this.#http.get<BackendEPCRatings[]>('/api/dashboard/epc-ratings', { withCredentials: true }).pipe(
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
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
