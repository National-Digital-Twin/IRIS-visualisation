import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MultiButtonFilterComponent } from '@components/multi-button-filter/multi-button-filter.component';
import { BoundingBox } from '@core/models';
import { MAP_SERVICE } from '@core/services/map.token';
import { map } from 'rxjs';
import { FilterMeta, filterNames, FilterPanel, FilterPanelService, panelNames } from './filter-panel.service';

export type FilterDialogData = {
    filterProps?: Record<(typeof filterNames)[number], string[]>;
};

@Component({
    selector: 'c477-filter-panel',
    imports: [
        CommonModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatDialogActions,
        MatDialogClose,
        MatDialogContent,
        MatIconModule,
        MatExpansionModule,
        MultiButtonFilterComponent,
        ReactiveFormsModule,
    ],
    templateUrl: './filter-panel.component.html',
    styleUrl: './filter-panel.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPanelComponent implements OnInit {
    readonly #mapService = inject(MAP_SERVICE);
    readonly #filterPanelService: FilterPanelService = inject(FilterPanelService);

    readonly #data: FilterDialogData = inject(MAT_DIALOG_DATA);
    readonly #dialogRef = inject(MatDialogRef<FilterPanelComponent>);

    public filtersForm: FormGroup = new FormGroup({});
    public boundingBox: WritableSignal<BoundingBox | null> = signal(null);
    public filterPanels: WritableSignal<FilterPanel[]> = signal([]);

    constructor() {
        effect(() => {
            const boundingBox = this.boundingBox();

            if (boundingBox) {
                this.#filterPanelService
                    .retrieveFilterPanels(boundingBox, this.#data.filterProps)
                    .pipe(map((panels) => this.filterPanels.set(panels)))
                    .subscribe();
            }
        });

        effect(() => {
            const panels = this.filterPanels();

            if (panels.length === 0) {
                return;
            }

            const filters = panels.reduce((curr, next) => {
                return [...curr, ...next.filters];
            }, [] as FilterMeta[]);

            const values = filters.reduce((curr, next) => ({ ...curr, [next.name]: next.selected }), {} as Record<string, string[]>);

            const formControls = filterNames.reduce((curr, next) => {
                const field = { [next]: new FormControl(values[next] ?? []) };
                return { ...curr, ...field };
            }, {});

            this.filtersForm = new FormGroup(formControls);
        });
    }

    public ngOnInit(): void {
        const bounds = this.#mapService.currentMapBounds();

        if (bounds) {
            const boundingBox: BoundingBox = {
                minX: bounds.getSouth(),
                maxX: bounds.getNorth(),
                minY: bounds.getWest(),
                maxY: bounds.getEast(),
            };
            this.boundingBox.set(boundingBox);
        }
    }

    public expandPanel(panelTitle: string): boolean {
        const hasSelection = Object.values<string[]>(this.filtersForm.value).some((value) => value.length > 0);

        if (hasSelection) {
            const panels = this.filterPanels();
            const panel = panels.find((panel) => panel.title === panelTitle);

            if (!panel) {
                return false;
            }

            return panel.filters.some((filter) => this.filtersForm.value[filter.name].length > 0);
        }

        if (panelTitle === panelNames[0]) {
            return true;
        }
        return false;
    }

    public clearAll(): void {
        this.filtersForm.reset();
        this.#dialogRef.close({ clear: true });
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
