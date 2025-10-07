import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { DashboardService, OverallEPCResponse } from '@core/services/dashboard.service';
import { PlotlyModule, PlotlyComponent } from 'angular-plotly.js';
import { Polygon } from 'geojson';
import type { Config } from 'plotly.js-dist-min';
import * as Plotly from 'plotly.js-dist-min';
import { Subscription } from 'rxjs';
import { ChartBuilderService, DashboardCharts } from './chart-builder.service';

@Component({
    selector: 'c477-plotly-dashboard',
    imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatToolbarModule, PlotlyModule],
    templateUrl: './plotly-dashboard.html',
    styleUrl: './plotly-dashboard.scss',
})
export class PlotlyDashboardComponent implements OnInit, OnDestroy {
    readonly #router = inject(Router);
    readonly #service = inject(DashboardService);
    readonly #chartBuilder = inject(ChartBuilderService);
    readonly #subscriptions = new Subscription();

    @ViewChild('barPlot') public barPlot?: PlotlyComponent;

    public hiddenRatings: Record<string, boolean> = {};
    public overallEPCResponse?: OverallEPCResponse;

    public readonly allRegions = [
        'East Midlands',
        'East of England',
        'London',
        'Mid and West Wales',
        'North East',
        'North Wales',
        'North West',
        'South East',
        'South Wales Central',
        'South Wales East',
        'South Wales West',
        'South West',
        'West Midlands',
        'Yorkshire & Humber',
    ];

    public readonly characteristicOptions = [
        { value: 'double glazing', label: 'Double Glazing' },
        { value: 'single glazing', label: 'Single Glazing' },
        { value: 'cavity wall', label: 'Cavity Wall' },
        { value: 'solar panels', label: 'Solar Panels' },
        { value: 'pitched roof', label: 'Pitched Roof' },
        { value: 'solid floor', label: 'Solid Floor' },
        { value: 'roof insulation 150mm', label: 'Roof Insulation 150mm' },
        { value: 'roof insulation 200mm', label: 'Roof Insulation 200mm' },
        { value: 'roof insulation 250mm', label: 'Roof Insulation 250mm' },
    ];

    public readonly chartConfigs: Record<string, Partial<Config>> = {
        default: { responsive: true, displayModeBar: false, displaylogo: false },
        withToolbar: { responsive: true, displayModeBar: true, displaylogo: false },
    };

    public charts = signal<DashboardCharts>({
        epcRegion: { data: [], layout: {}, loading: true, metadata: { selectedRegions: [] } },
        overallEPCDonut: { data: [], layout: {}, loading: true, metadata: { total: 0 } },
        overallEPCBar: { data: [], layout: {}, loading: true, metadata: { total: 0 } },
        characteristics: { data: [], layout: {}, loading: true, metadata: { selectedCharacteristic: '', selectedRegions: [] } },
        sapTimeline: { data: [], layout: {}, loading: true },
    });

    public selectedCharacteristic = signal('double glazing');
    public selectedRegions = signal<string[]>(['East Midlands', 'North East', 'West Midlands', 'North West']);
    public selectedEPCRegions = signal<string[]>(['North West', 'North East', 'West Midlands', 'East Midlands']);

    public selectedArea: GeoJSON.Feature<Polygon> = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [],
        },
    };

    public ngOnInit(): void {
        this.loadCharacteristicsData();
        this.loadSapTimelineData();
        this.loadEPCRegionData();
        this.loadOverallEPCData();
    }

    public onBarChartInitialized(): void {
        if (this.barPlot?.plotlyInstance) {
            this.barPlot.plotlyInstance.on('plotly_click', (data: Plotly.PlotMouseEvent) => {
                this.onBarChartClick(data);
            });
        }
    }

    public ngOnDestroy(): void {
        this.#subscriptions.unsubscribe();
    }

    public handleReturnToMapView(): void {
        this.#router.navigateByUrl('/');
    }

    public onCharacteristicChange(characteristic: string): void {
        this.selectedCharacteristic.set(characteristic);
        this.loadCharacteristicsData();
    }

    public onCharacteristicsRegionChange(regions: string[]): void {
        this.selectedRegions.set(regions);
        this.loadCharacteristicsData();
    }

    public onEPCRegionChange(regions: string[]): void {
        this.selectedEPCRegions.set(regions);
        this.loadEPCRegionData();
    }

    public onBarChartClick(event: Plotly.PlotMouseEvent): void {
        if (!event?.points?.length || !this.overallEPCResponse) {
            return;
        }

        const pointIndex = event.points[0].pointIndex;
        const clickedRating = this.overallEPCResponse.ratings[pointIndex].rating;

        this.hiddenRatings[clickedRating] = !this.hiddenRatings[clickedRating];

        const donutData = this.#chartBuilder.buildOverallEPCDonut(this.overallEPCResponse, this.hiddenRatings);
        const barData = this.#chartBuilder.buildOverallEPCBar(this.overallEPCResponse, this.hiddenRatings);

        this.updateChartState('overallEPCDonut', { ...donutData, loading: false });
        this.updateChartState('overallEPCBar', { ...barData, loading: false });
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
            this.overallEPCResponse = response;
            const donutData = this.#chartBuilder.buildOverallEPCDonut(response);
            const barData = this.#chartBuilder.buildOverallEPCBar(response);

            this.updateChartState('overallEPCDonut', { ...donutData, loading: false });
            this.updateChartState('overallEPCBar', { ...barData, loading: false });
        });

        this.#subscriptions.add(sub);
    }

    private loadSapTimelineData(): void {
        this.updateChartState('sapTimeline', { loading: true });

        const sub = this.#service.getSAPTimeline().subscribe((response) => {
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
