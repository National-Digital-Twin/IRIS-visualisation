import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { DashboardService } from '@core/services/dashboard.service';
import { PlotlyModule } from 'angular-plotly.js';
import { Polygon } from 'geojson';
import type { Config } from 'plotly.js-dist-min';
import { Subscription } from 'rxjs';
import { ChartBuilderService, DashboardCharts } from './chart-builder.service';

@Component({
    selector: 'app-plotly-dashboard',
    imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatToolbarModule, PlotlyModule],
    templateUrl: './plotly-dashboard.html',
    styleUrl: './plotly-dashboard.scss',
})
export class PlotlyDashboardComponent implements OnInit, OnDestroy {
    readonly #router = inject(Router);
    readonly #service = inject(DashboardService);
    readonly #chartBuilder = inject(ChartBuilderService);
    readonly #subscriptions = new Subscription();

    readonly allRegions = [
        'East Midlands',
        'East of England',
        'London',
        'North East',
        'North West',
        'Scotland',
        'South East',
        'South West',
        'Wales',
        'West Midlands',
        'Yorkshire and The Humber',
    ];

    readonly characteristicOptions = [
        { value: 'double glazing', label: 'Double Glazing' },
        { value: 'triple glazing', label: 'Triple Glazing' },
        { value: 'cavity wall', label: 'Cavity Wall' },
        { value: 'solar panels', label: 'Solar Panels' },
    ];

    readonly chartConfigs: Record<string, Partial<Config>> = {
        default: { responsive: true, displayModeBar: false, displaylogo: false },
        withToolbar: { responsive: true, displayModeBar: true, displaylogo: false },
    };

    charts = signal<DashboardCharts>({
        epcRegion: { data: [], layout: {}, loading: true, metadata: { selectedRegions: [] } },
        overallEPCDonut: { data: [], layout: {}, loading: true, metadata: { total: 0 } },
        overallEPCBar: { data: [], layout: {}, loading: true, metadata: { total: 0 } },
        characteristics: { data: [], layout: {}, loading: true, metadata: { selectedCharacteristic: '', selectedRegions: [] } },
        sapTimeline: { data: [], layout: {}, loading: true },
    });

    selectedCharacteristic = signal('double glazing');
    selectedRegions = signal<string[]>(['East Midlands', 'North East', 'West Midlands', 'North West']);
    selectedEPCRegions = signal<string[]>(['North West', 'North East', 'West Midlands', 'East Midlands']);

    selectedArea: GeoJSON.Feature<Polygon> = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [],
        },
    };

    ngOnInit(): void {
        this.loadCharacteristicsData();
        this.loadSapTimelineData();
        this.loadEPCRegionData();
        this.loadOverallEPCData();
    }

    ngOnDestroy(): void {
        this.#subscriptions.unsubscribe();
    }

    handleReturnToMapView(): void {
        this.#router.navigateByUrl('/');
    }

    onCharacteristicChange(characteristic: string): void {
        this.selectedCharacteristic.set(characteristic);
        this.loadCharacteristicsData();
    }

    onCharacteristicsRegionChange(regions: string[]): void {
        this.selectedRegions.set(regions);
        this.loadCharacteristicsData();
    }

    onEPCRegionChange(regions: string[]): void {
        this.selectedEPCRegions.set(regions);
        this.loadEPCRegionData();
    }

    private loadCharacteristicsData(): void {
        this.updateChartState('characteristics', { loading: true });

        const sub = this.#service.getBuildingCharacteristics(this.selectedCharacteristic()).subscribe((response) => {
            const chartData = this.#chartBuilder.buildCharacteristicsChart(this.selectedCharacteristic(), response.regions, this.selectedRegions());

            this.updateChartState('characteristics', { ...chartData, loading: false });
        });

        this.#subscriptions.add(sub);
    }

    private loadEPCRegionData(): void {
        this.updateChartState('epcRegion', { loading: true });

        const sub = this.#service.getEPCByRegion().subscribe((regionData) => {
            const chartData = this.#chartBuilder.buildEPCRegionChart(regionData, this.selectedEPCRegions());

            this.updateChartState('epcRegion', { ...chartData, loading: false });
        });

        this.#subscriptions.add(sub);
    }

    private loadOverallEPCData(): void {
        this.updateChartState('overallEPCDonut', { loading: true });
        this.updateChartState('overallEPCBar', { loading: true });

        const sub = this.#service.getOverallEPC().subscribe((response) => {
            const donutData = this.#chartBuilder.buildOverallEPCDonut(response);
            const barData = this.#chartBuilder.buildOverallEPCBar(response);

            this.updateChartState('overallEPCDonut', { ...donutData, loading: false });
            this.updateChartState('overallEPCBar', { ...barData, loading: false });
        });

        this.#subscriptions.add(sub);
    }

    private loadSapTimelineData(): void {
        this.updateChartState('sapTimeline', { loading: true });

        const sub = this.#service.getSAPTimeline(this.selectedArea).subscribe((response) => {
            const chartData = this.#chartBuilder.buildSAPTimeline(response.timeline);

            this.updateChartState('sapTimeline', { ...chartData, loading: false });
        });

        this.#subscriptions.add(sub);
    }

    private updateChartState<K extends keyof DashboardCharts>(chartKey: K, updates: Partial<DashboardCharts[K]>): void {
        this.charts.update((current) => ({
            ...current,
            [chartKey]: {
                ...current[chartKey],
                ...updates,
            },
        }));
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
