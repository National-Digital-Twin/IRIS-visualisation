import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { EPCDataService } from './epc-data.service';

export interface RegionCharacteristicData {
    region_name: string;
    count: number;
    total: number;
}

export interface BuildingCharacteristicsResponse {
    characteristic: string;
    regions: RegionCharacteristicData[];
}

export interface TimelineDataPoint {
    year: number;
    avg_sap_score: number;
    assessment_count: number;
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

@Injectable({ providedIn: 'root' })
export class DashboardService {
    readonly #epcService = inject(EPCDataService);

    private readonly REGION_NAME_MAP: Record<string, string> = {
        'Eastern English Region': 'East of England',
        'East Midlands English Region': 'East Midlands',
        'London English Region': 'London',
        'North East English Region': 'North East',
        'North West English Region': 'North West',
        'South East English Region': 'South East',
        'South West English Region': 'South West',
        'Wales': 'Wales',
        'West Midlands English Region': 'West Midlands',
        'Yorkshire and the Humber English Region': 'Yorkshire and The Humber',
    };

    public getBuildingCharacteristics(characteristic: string): Observable<BuildingCharacteristicsResponse> {
        const dataSets: Record<string, RegionCharacteristicData[]> = {
            'double glazing': [
                { region_name: 'East Midlands', count: 28000, total: 72000 },
                { region_name: 'East of England', count: 42000, total: 98000 },
                { region_name: 'London', count: 38000, total: 125000 },
                { region_name: 'North East', count: 18500, total: 47500 },
                { region_name: 'North West', count: 15000, total: 150000 },
                { region_name: 'Scotland', count: 35000, total: 92000 },
                { region_name: 'South East', count: 51000, total: 145000 },
                { region_name: 'South West', count: 38000, total: 88000 },
                { region_name: 'Wales', count: 22000, total: 56000 },
                { region_name: 'West Midlands', count: 32000, total: 80000 },
                { region_name: 'Yorkshire and The Humber', count: 41000, total: 115000 },
            ],
            'triple glazing': [
                { region_name: 'East Midlands', count: 5500, total: 72000 },
                { region_name: 'East of England', count: 8200, total: 98000 },
                { region_name: 'London', count: 6500, total: 125000 },
                { region_name: 'North East', count: 5200, total: 47500 },
                { region_name: 'North West', count: 10000, total: 150000 },
                { region_name: 'Scotland', count: 12000, total: 92000 },
                { region_name: 'South East', count: 9800, total: 145000 },
                { region_name: 'South West', count: 6200, total: 88000 },
                { region_name: 'Wales', count: 4500, total: 56000 },
                { region_name: 'West Midlands', count: 7000, total: 80000 },
                { region_name: 'Yorkshire and The Humber', count: 8500, total: 115000 },
            ],
            'cavity wall': [
                { region_name: 'East Midlands', count: 50000, total: 72000 },
                { region_name: 'East of England', count: 68000, total: 98000 },
                { region_name: 'London', count: 72000, total: 125000 },
                { region_name: 'North East', count: 28000, total: 47500 },
                { region_name: 'North West', count: 92000, total: 150000 },
                { region_name: 'Scotland', count: 58000, total: 92000 },
                { region_name: 'South East', count: 95000, total: 145000 },
                { region_name: 'South West', count: 61000, total: 88000 },
                { region_name: 'Wales', count: 38000, total: 56000 },
                { region_name: 'West Midlands', count: 54000, total: 80000 },
                { region_name: 'Yorkshire and The Humber', count: 78000, total: 115000 },
            ],
            'solar panels': [
                { region_name: 'East Midlands', count: 8000, total: 72000 },
                { region_name: 'East of England', count: 12500, total: 98000 },
                { region_name: 'London', count: 7200, total: 125000 },
                { region_name: 'North East', count: 3800, total: 47500 },
                { region_name: 'North West', count: 13000, total: 150000 },
                { region_name: 'Scotland', count: 6500, total: 92000 },
                { region_name: 'South East', count: 18000, total: 145000 },
                { region_name: 'South West', count: 11500, total: 88000 },
                { region_name: 'Wales', count: 4200, total: 56000 },
                { region_name: 'West Midlands', count: 9000, total: 80000 },
                { region_name: 'Yorkshire and The Humber', count: 10500, total: 115000 },
            ],
        };

        return of({
            characteristic,
            regions: dataSets[characteristic.toLowerCase()] ?? [],
        });
    }

    public getSAPTimeline(): Observable<SAPTimelineResponse> {
        return of({
            timeline: [
                { year: 2010, avg_sap_score: 58.3, assessment_count: 125000 },
                { year: 2011, avg_sap_score: 60.1, assessment_count: 130000 },
                { year: 2012, avg_sap_score: 62.5, assessment_count: 135000 },
                { year: 2013, avg_sap_score: 64.8, assessment_count: 140000 },
                { year: 2014, avg_sap_score: 66.2, assessment_count: 145000 },
                { year: 2015, avg_sap_score: 68.5, assessment_count: 150000 },
                { year: 2016, avg_sap_score: 69.8, assessment_count: 155000 },
                { year: 2017, avg_sap_score: 71.2, assessment_count: 160000 },
                { year: 2018, avg_sap_score: 72.8, assessment_count: 165000 },
                { year: 2019, avg_sap_score: 73.9, assessment_count: 170000 },
                { year: 2020, avg_sap_score: 75.2, assessment_count: 175000 },
                { year: 2021, avg_sap_score: 76.8, assessment_count: 180000 },
                { year: 2022, avg_sap_score: 78.1, assessment_count: 185000 },
                { year: 2023, avg_sap_score: 79.5, assessment_count: 190000 },
                { year: 2024, avg_sap_score: 81.2, assessment_count: 195000 },
                { year: 2025, avg_sap_score: 82.5, assessment_count: 200000 },
            ],
        });
    }

    public getEPCByRegion(): Observable<EPCRegionData[]> {
        return this.#epcService.getEPCData('region').pipe(
            map((featureCollection) =>
                featureCollection.features.map((feature) => ({
                    region_name: this.REGION_NAME_MAP[feature.properties.name] || feature.properties.name,
                    epc_a: feature.properties.epc_a,
                    epc_b: feature.properties.epc_b,
                    epc_c: feature.properties.epc_c,
                    epc_d: feature.properties.epc_d,
                    epc_e: feature.properties.epc_e,
                    epc_f: feature.properties.epc_f,
                    epc_g: feature.properties.epc_g,
                    total: feature.properties.total,
                })),
            ),
        );
    }

    public getOverallEPC(): Observable<OverallEPCResponse> {
        return this.#epcService.getEPCData('region').pipe(
            map((featureCollection) => {
                const totals = featureCollection.features.reduce(
                    (acc, feature) => ({
                        a: acc.a + feature.properties.epc_a,
                        b: acc.b + feature.properties.epc_b,
                        c: acc.c + feature.properties.epc_c,
                        d: acc.d + feature.properties.epc_d,
                        e: acc.e + feature.properties.epc_e,
                        f: acc.f + feature.properties.epc_f,
                        g: acc.g + feature.properties.epc_g,
                    }),
                    { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0 },
                );

                const total = totals.a + totals.b + totals.c + totals.d + totals.e + totals.f + totals.g;

                return {
                    total,
                    ratings: [
                        { rating: 'A', count: totals.a },
                        { rating: 'B', count: totals.b },
                        { rating: 'C', count: totals.c },
                        { rating: 'D', count: totals.d },
                        { rating: 'E', count: totals.e },
                        { rating: 'F', count: totals.f },
                        { rating: 'G', count: totals.g },
                    ],
                };
            }),
        );
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
