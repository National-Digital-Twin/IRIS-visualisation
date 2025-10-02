import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { PlotlyDashboardMockService } from '@core/services/plotly-dashboard-mock.service';
import { PlotlyModule } from 'angular-plotly.js';
import { Polygon } from 'geojson';
import type { Data, Layout, Config } from 'plotly.js-dist-min';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-plotly-dashboard',
    imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatToolbarModule, PlotlyModule],
    templateUrl: './plotly-dashboard.html',
    styleUrl: './plotly-dashboard.scss',
})
export class PlotlyDashboardComponent implements OnInit, OnDestroy {
    readonly #router = inject(Router);
    readonly #service = inject(PlotlyDashboardMockService);
    readonly #subscriptions = new Subscription();

    selectedCharacteristic = signal('double glazing');
    characteristicsData = signal<Data[]>([]);
    characteristicsLayout = signal<Partial<Layout>>({});
    characteristicsConfig: Partial<Config> = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
    };

    sapTimelineData = signal<Data[]>([]);
    sapTimelineLayout = signal<Partial<Layout>>({});
    sapTimelineConfig: Partial<Config> = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
    };

    characteristicOptions = [
        { value: 'double glazing', label: 'Double Glazing' },
        { value: 'triple glazing', label: 'Triple Glazing' },
        { value: 'cavity wall', label: 'Cavity Wall' },
        { value: 'solar panels', label: 'Solar Panels' },
    ];

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

    private loadCharacteristicsData(): void {
        const sub = this.#service.getBuildingCharacteristics(this.selectedCharacteristic()).subscribe((response) => {
            const sortedRegions = [...response.regions].sort((a, b) => a.region_name.localeCompare(b.region_name));
            const regionsWithPercentages = sortedRegions.map((r) => ({
                ...r,
                percentage: (r.count / r.total) * 100,
            }));

            const data: Data[] = [
                {
                    type: 'bar',
                    x: regionsWithPercentages.map((r) => r.region_name),
                    y: regionsWithPercentages.map((r) => r.percentage),
                    marker: { color: '#5729CE' },
                    text: regionsWithPercentages.map((r) => `${Math.round(r.percentage)}%`),
                    textposition: 'auto',
                    textfont: { color: 'white', size: 16, family: 'Roboto, sans-serif' },
                    hovertemplate: '<b>%{x}</b><br>%{y:.1f}%<br>(%{customdata})<extra></extra>',
                    customdata: regionsWithPercentages.map((r) => `${r.count.toLocaleString()} of ${r.total.toLocaleString()} buildings`),
                },
            ];

            const maxPercentage = Math.max(...regionsWithPercentages.map((r) => r.percentage));
            const layout: Partial<Layout> = {
                margin: { l: 40, r: 20, t: 20, b: 80 },
                xaxis: {
                    title: { text: '' },
                    tickangle: 0,
                    tickfont: { size: 11, color: '#333' },
                    automargin: true,
                },
                yaxis: {
                    title: { text: '' },
                    range: [0, maxPercentage * 1.15],
                    visible: false,
                },
                font: { family: 'Roboto, sans-serif' },
                height: 250,
                plot_bgcolor: 'white',
                paper_bgcolor: 'white',
                showlegend: false,
            };

            this.characteristicsData.set(data);
            this.characteristicsLayout.set(layout);
        });

        this.#subscriptions.add(sub);
    }

    private loadSapTimelineData(): void {
        const sub = this.#service.getSAPTimeline(this.selectedArea).subscribe((response) => {
            const data: Data[] = [
                {
                    type: 'scatter',
                    mode: 'lines',
                    x: response.timeline.map((t) => t.year),
                    y: response.timeline.map((t) => t.avg_sap_score),
                    line: { color: '#000000', width: 2 },
                    hovertemplate: '<b>%{x}</b><br>SAP Score: %{y:.1f}<br>Assessments: %{customdata}<extra></extra>',
                    customdata: response.timeline.map((t) => t.assessment_count.toLocaleString()),
                },
            ];

            const layout: Partial<Layout> = {
                margin: { l: 50, r: 15, t: 10, b: 40 },
                xaxis: {
                    title: { text: '' },
                    tickmode: 'linear',
                    dtick: 5,
                    showgrid: false,
                    tickfont: { size: 9 },
                },
                yaxis: {
                    title: { text: 'SAP score', font: { size: 10 } },
                    range: [50, 100],
                    showgrid: true,
                    gridcolor: '#e0e0e0',
                    tickfont: { size: 9 },
                },
                font: { family: 'Roboto, sans-serif', size: 10 },
                height: 250,
                plot_bgcolor: 'white',
                paper_bgcolor: 'white',
            };

            this.sapTimelineData.set(data);
            this.sapTimelineLayout.set(layout);
        });

        this.#subscriptions.add(sub);
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
