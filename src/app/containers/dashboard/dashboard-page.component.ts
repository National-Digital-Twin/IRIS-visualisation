import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Polygon } from 'geojson';
import { DashboardType } from './chart.service';
import { BuildingFuelChartComponent } from './charts/building-fuel-chart/building-fuel-chart.component';
import { CharacteristicsChartComponent } from './charts/characteristics-chart/characteristics-chart.component';
import { EpcRegionChartComponent } from './charts/epc-region-chart/epc-region-chart.component';
import { ExtremeWeatherChartComponent } from './charts/extreme-weather-chart/extreme-weather-chart.component';
import { OverallEpcChartComponent } from './charts/overall-epc-chart/overall-epc-chart.component';
import { SapTimelineChartComponent } from './charts/sap-timeline-chart/sap-timeline-chart.component';

@Component({
    selector: 'c477-dashboard-page',
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatToolbarModule,
        OverallEpcChartComponent,
        EpcRegionChartComponent,
        CharacteristicsChartComponent,
        SapTimelineChartComponent,
        BuildingFuelChartComponent,
        ExtremeWeatherChartComponent,
    ],
    templateUrl: './dashboard-page.component.html',
    styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {
    readonly #router = inject(Router);
    readonly #route = inject(ActivatedRoute);

    public dashboardType = signal<DashboardType>('national');
    public selectedArea = signal<GeoJSON.Feature<Polygon> | undefined>(undefined);

    public ngOnInit(): void {
        const routeData = this.#route.snapshot.data;
        if (routeData['type']) {
            this.dashboardType.set(routeData['type']);

            if (routeData['type'] === 'area') {
                const state = history.state;
                if (state?.selectedArea) {
                    this.selectedArea.set(state.selectedArea as GeoJSON.Feature<Polygon>);
                }
            }
        }
    }

    public handleReturnToMapView(): void {
        this.#router.navigateByUrl('/');
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
