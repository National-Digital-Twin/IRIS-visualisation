import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AreaFilter } from '../../core/models/area-filter.model';
import { DashboardType } from './chart.service';
import { BuildingFuelChartComponent } from './charts/building-fuel-chart/building-fuel-chart.component';
import { CharacteristicsChartComponent } from './charts/characteristics-chart/characteristics-chart.component';
import { DeprivationDimensionChartComponent } from './charts/deprivation-dimension-chart/deprivation-dimension-chart.component';
import { EpcByAreaChartComponent } from './charts/epc-by-area-chart/epc-by-area-chart.component';
import { EpcByFeatureChartComponent } from './charts/epc-by-feature-chart/epc-by-feature-chart.component';
import { EpcRatingsOvertimeChartComponent } from './charts/epc-ratings-over-time-chart/epc-ratings-over-time-chart.component';
import { ExtremeWeatherChartComponent } from './charts/extreme-weather-chart/extreme-weather-chart.component';
import { InDateVsExpiredEpcsComponent } from './charts/in-date-vs-expired-epcs-chart/in-date-vs-expired-epcs-chart.component';
import { OverallEpcChartComponent } from './charts/overall-epc-chart/overall-epc-chart.component';
import { SapTimelineByAreaChartComponent } from './charts/sap-timeline-by-area-chart/sap-timeline-by-area-chart.component';
import { SapTimelineByPropertyTypeChartComponent } from './charts/sap-timeline-by-property-type-chart/sap-timeline-by-property-type-chart.component';
import { SapTimelineChartComponent } from './charts/sap-timeline-chart/sap-timeline-chart.component';

const AREA_FILTER_STORAGE_KEY = 'dashboard.areaFilter';

@Component({
    selector: 'c477-dashboard-page',
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatToolbarModule,
        OverallEpcChartComponent,
        EpcByAreaChartComponent,
        CharacteristicsChartComponent,
        DeprivationDimensionChartComponent,
        SapTimelineChartComponent,
        EpcRatingsOvertimeChartComponent,
        BuildingFuelChartComponent,
        EpcByFeatureChartComponent,
        ExtremeWeatherChartComponent,
        InDateVsExpiredEpcsComponent,
        SapTimelineByPropertyTypeChartComponent,
        SapTimelineByAreaChartComponent,
    ],
    templateUrl: './dashboard-page.component.html',
    styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {
    readonly #router = inject(Router);
    readonly #route = inject(ActivatedRoute);

    public dashboardType = signal<DashboardType>('national');
    public areaFilter = signal<AreaFilter | undefined>(undefined);

    public ngOnInit(): void {
        const routeData = this.#route.snapshot.data;
        if (routeData['type']) {
            this.dashboardType.set(routeData['type']);

            if (routeData['type'] === 'area') {
                const state = history.state;

                if (state?.areaFilter) {
                    this.areaFilter.set(state.areaFilter);
                    this.#persistAreaFilter(state.areaFilter);
                } else {
                    const persisted = this.#loadPersistedAreaFilter();
                    if (persisted) {
                        this.areaFilter.set(persisted);
                    }
                }
            }
        }
    }

    public handleReturnToMapView(): void {
        this.#router.navigateByUrl('/');
    }

    #persistAreaFilter(filter: AreaFilter | undefined): void {
        try {
            if (!filter) {
                localStorage.removeItem(AREA_FILTER_STORAGE_KEY);
                return;
            }

            localStorage.setItem(AREA_FILTER_STORAGE_KEY, JSON.stringify(filter));
        } catch {
            // Ignore storage failures - not a critical issue - state simply won't persist
        }
    }

    #loadPersistedAreaFilter(): AreaFilter | undefined {
        try {
            const saved = localStorage.getItem(AREA_FILTER_STORAGE_KEY);
            if (!saved) {
                return undefined;
            }

            return JSON.parse(saved) as AreaFilter;
        } catch {
            return undefined;
        }
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
