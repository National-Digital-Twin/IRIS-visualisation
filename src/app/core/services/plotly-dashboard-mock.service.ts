import { Injectable } from '@angular/core';
import { Polygon } from 'geojson';
import { Observable, of } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class PlotlyDashboardMockService {
    getBuildingCharacteristics(characteristic: string): Observable<BuildingCharacteristicsResponse> {
        const dataSets: Record<string, RegionCharacteristicData[]> = {
            'double glazing': [
                { region_name: 'West Midlands', count: 32000, total: 80000 },
                { region_name: 'North East', count: 18500, total: 47500 },
                { region_name: 'East Midlands', count: 28000, total: 72000 },
                { region_name: 'North West', count: 15000, total: 150000 },
            ],
            'triple glazing': [
                { region_name: 'North East', count: 5200, total: 47500 },
                { region_name: 'West Midlands', count: 7000, total: 80000 },
                { region_name: 'East Midlands', count: 5500, total: 72000 },
                { region_name: 'North West', count: 10000, total: 150000 },
            ],
            'cavity wall': [
                { region_name: 'East Midlands', count: 50000, total: 72000 },
                { region_name: 'West Midlands', count: 54000, total: 80000 },
                { region_name: 'North West', count: 92000, total: 150000 },
                { region_name: 'North East', count: 28000, total: 47500 },
            ],
            'solar panels': [
                { region_name: 'West Midlands', count: 9000, total: 80000 },
                { region_name: 'East Midlands', count: 8000, total: 72000 },
                { region_name: 'North West', count: 13000, total: 150000 },
                { region_name: 'North East', count: 3800, total: 47500 },
            ],
        };

        return of({
            characteristic,
            regions: dataSets[characteristic.toLowerCase()] ?? [],
        });
    }

    getSAPTimeline(_area: GeoJSON.Feature<Polygon>): Observable<SAPTimelineResponse> {
        return of({
            timeline: [
                { year: 2010, avg_sap_score: 58.3, assessment_count: 125000 },
                { year: 2011, avg_sap_score: 60.1, assessment_count: 142000 },
                { year: 2012, avg_sap_score: 62.5, assessment_count: 138000 },
                { year: 2013, avg_sap_score: 64.8, assessment_count: 155000 },
                { year: 2014, avg_sap_score: 66.2, assessment_count: 162000 },
                { year: 2015, avg_sap_score: 68.5, assessment_count: 148000 },
                { year: 2016, avg_sap_score: 69.8, assessment_count: 159000 },
                { year: 2017, avg_sap_score: 71.2, assessment_count: 167000 },
                { year: 2018, avg_sap_score: 72.8, assessment_count: 172000 },
                { year: 2019, avg_sap_score: 73.9, assessment_count: 165000 },
                { year: 2020, avg_sap_score: 75.2, assessment_count: 142000 },
                { year: 2021, avg_sap_score: 76.8, assessment_count: 155000 },
                { year: 2022, avg_sap_score: 78.1, assessment_count: 168000 },
                { year: 2023, avg_sap_score: 79.5, assessment_count: 175000 },
                { year: 2024, avg_sap_score: 81.2, assessment_count: 162000 },
                { year: 2025, avg_sap_score: 82.5, assessment_count: 98000 },
            ],
        });
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
