import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { DashboardService } from '@core/services/dashboard.service';
import { Polygon } from 'geojson';
import { BaseChartDirective } from 'ng2-charts';
import { Subscription } from 'rxjs';
import { ChartBuilderService, DashboardCharts } from './chart-builder.service';

@Component({
    selector: 'c477-chartjs-dashboard',
    imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatToolbarModule, BaseChartDirective],
    templateUrl: './chartjs-dashboard.html',
    styleUrl: './chartjs-dashboard.scss',
})
export class ChartJSDashboardComponent implements OnInit, OnDestroy {
    readonly #router = inject(Router);
    readonly #service = inject(DashboardService);
    readonly #chartBuilder = inject(ChartBuilderService);
    readonly #subscriptions = new Subscription();

    @ViewChild('donutChart', { read: BaseChartDirective }) public donutChart?: BaseChartDirective;
    @ViewChild('barChart', { read: BaseChartDirective }) public barChart?: BaseChartDirective;

    public syncCharts = (rating: string, isHidden: boolean): void => {
        const chartInstance = (
            this.donutChart as BaseChartDirective & {
                chart?: {
                    data: { labels?: string[] };
                    getDataVisibility: (index: number) => boolean;
                    toggleDataVisibility: (index: number) => void;
                    update: () => void;
                };
            }
        )?.chart;

        if (chartInstance) {
            const donutIndex = chartInstance.data.labels?.findIndex((label: string) => label === rating) ?? -1;

            if (donutIndex !== -1) {
                const currentlyVisible = chartInstance.getDataVisibility(donutIndex);

                if ((isHidden && currentlyVisible) || (!isHidden && !currentlyVisible)) {
                    chartInstance.toggleDataVisibility(donutIndex);
                    chartInstance.update();
                }
            }
        }
    };

    public readonly allRegions = [
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

    public readonly characteristicOptions = [
        { value: 'double glazing', label: 'Double Glazing' },
        { value: 'triple glazing', label: 'Triple Glazing' },
        { value: 'cavity wall', label: 'Cavity Wall' },
        { value: 'solar panels', label: 'Solar Panels' },
    ];

    public charts = signal<DashboardCharts>({
        epcRegion: { config: { type: 'bar', data: { labels: [], datasets: [] } }, loading: true, metadata: { selectedRegions: [] } },
        overallEPCDonut: { config: { type: 'doughnut', data: { labels: [], datasets: [] } }, loading: true, metadata: { total: 0 } },
        overallEPCBar: { config: { type: 'bar', data: { labels: [], datasets: [] } }, loading: true, metadata: { total: 0 } },
        characteristics: {
            config: { type: 'bar', data: { labels: [], datasets: [] } },
            loading: true,
            metadata: { selectedCharacteristic: '', selectedRegions: [] },
        },
        sapTimeline: { config: { type: 'line', data: { labels: [], datasets: [] } }, loading: true },
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
            this.updateChartState('overallEPCDonut', { ...donutData, loading: false });

            setTimeout(() => {
                const barData = this.#chartBuilder.buildOverallEPCBar(response, this.syncCharts);
                this.updateChartState('overallEPCBar', { ...barData, loading: false });
            }, 0);
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
