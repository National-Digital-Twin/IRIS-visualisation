import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MultiButtonFilterComponent } from '@components/multi-button-filter/multi-button-filter.component';
import { FilterProps, MultiButtonFilterOption } from '@core/models/advanced-filters.model';
import { BuildingModel } from '@core/models/building.model';
import { DataService } from '@core/services/data.service';
import { FilterOptionsService } from '@core/services/filter-options.service';
import { MapService } from '@core/services/map.service';
import { UtilService } from '@core/services/utils.service';
import { map } from 'rxjs';

type DialogData = {
    filterProps?: FilterProps;
    form: FormGroup;
};

type PanelData = {
    panelTitle: string;
    filters: MultiButtonFilterOption[];
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
})
export class FilterPanelComponent {
    readonly #data: DialogData = inject(MAT_DIALOG_DATA);
    readonly #dialogRef = inject(MatDialogRef<FilterPanelComponent>);
    readonly #utilService = inject(UtilService);
    readonly #dataService = inject(DataService);
    readonly #mapService = inject(MapService);
    readonly #filterOptions = inject(FilterOptionsService);
    readonly #destroyRef = inject(DestroyRef);

    public advancedFiltersForm: FormGroup;
    public noValidFilterOptions: boolean = false;

    private detailedBuildings: BuildingModel[] = [];

    private readonly generalFilters = signal<MultiButtonFilterOption[]>([
        {
            title: 'Post Code',
            data: [],
            formControlName: 'PostCode',
            selectedValues: this.#data.filterProps?.PostCode,
        },
        {
            title: 'Build Form',
            data: this.#filterOptions.buildFormOptions,
            formControlName: 'BuiltForm',
            selectedValues: this.#data.filterProps?.BuiltForm,
        },
        {
            title: 'Year of Inspection',
            data: [],
            formControlName: 'YearOfAssessment',
            selectedValues: this.#data.filterProps?.YearOfAssessment,
        },
        {
            title: 'EPC Expiry',
            data: this.#filterOptions.epcExpiryOptions,
            formControlName: 'EPCExpiry',
            selectedValues: this.#data.filterProps?.EPCExpiry,
        },
    ]);

    private readonly glazingFilters = signal<MultiButtonFilterOption[]>([
        {
            title: 'Multiple Glazing Type',
            data: this.#filterOptions.windowGlazingOptions,
            formControlName: 'WindowGlazing',
            selectedValues: this.#data.filterProps?.WindowGlazing,
        },
    ]);

    private readonly wallFilters = signal<MultiButtonFilterOption[]>([
        {
            title: 'Wall Construction',
            data: this.#filterOptions.wallConstructionOptions,
            formControlName: 'WallConstruction',
            selectedValues: this.#data.filterProps?.WallConstruction,
        },
        {
            title: 'Wall Insulation',
            data: this.#filterOptions.wallInsulationOptions,
            formControlName: 'WallInsulation',
            selectedValues: this.#data.filterProps?.WallInsulation,
        },
    ]);

    private readonly floorFilters = signal<MultiButtonFilterOption[]>([
        {
            title: 'Floor Construction',
            data: this.#filterOptions.floorConstructionOptions,
            formControlName: 'FloorConstruction',
            selectedValues: this.#data.filterProps?.FloorConstruction,
        },
        {
            title: 'Floor Insulation',
            data: this.#filterOptions.floorInsulationOptions,
            formControlName: 'FloorInsulation',
            selectedValues: this.#data.filterProps?.FloorInsulation,
        },
    ]);

    private readonly roofFilters = signal<MultiButtonFilterOption[]>([
        {
            title: 'Roof Construction',
            data: this.#filterOptions.roofConstructionOptions,
            formControlName: 'RoofConstruction',
            selectedValues: this.#data.filterProps?.RoofConstruction,
        },
        {
            title: 'Roof Insulation Location',
            data: this.#filterOptions.roofInsulationLocationOptions,
            formControlName: 'RoofInsulationLocation',
            selectedValues: this.#data.filterProps?.RoofInsulationLocation,
        },
        {
            title: 'Roof Insulation Thickness',
            data: this.#filterOptions.roofInsulationThicknessOptions,
            formControlName: 'RoofInsulationThickness',
            selectedValues: this.#data.filterProps?.RoofInsulationThickness,
        },
    ]);

    public otherPanels = computed<PanelData[]>(() => [
        { panelTitle: 'General', filters: this.generalFilters() },
        { panelTitle: 'Glazing', filters: this.glazingFilters() },
        { panelTitle: 'Wall', filters: this.wallFilters() },
        { panelTitle: 'Floor', filters: this.floorFilters() },
        { panelTitle: 'Roof', filters: this.roofFilters() },
    ]);

    constructor() {
        this.advancedFiltersForm = this.#data.form;

        // Get the current viewport bounding box
        const viewport = this.#mapService.getViewportBoundingBox();

        if (viewport) {
            // Load detailed buildings for the current viewport
            this.#dataService.queryDetailedBuildingsInViewport(viewport).subscribe({
                next: (buildings) => {
                    console.log('Detailed buildings loaded:', buildings.length);
                    this.detailedBuildings = buildings;
                    this.updateFilterOptions();
                },
                error: (error) => {
                    console.error('Error loading detailed buildings:', error);
                    this.detailedBuildings = [];
                    this.updateFilterOptions();
                },
            });
        } else {
            this.updateFilterOptions();
        }

        this.advancedFiltersForm.valueChanges
            .pipe(
                map(() => this.updateFilterEnabledState()),
                takeUntilDestroyed(this.#destroyRef),
            )
            .subscribe();
    }

    get dialogData(): DialogData {
        return this.#data;
    }

    public clearAll(): void {
        this.advancedFiltersForm.reset();
        this.#dialogRef.close({ clear: true });
    }

    public checkFiltersApplied(panelTitle: string): boolean {
        if (panelTitle === 'General' && Object.keys(this.advancedFiltersForm.value).every((key) => this.advancedFiltersForm.value[key] === null)) {
            // open first panel if form is empty
            return true;
        } else {
            const panel = this.otherPanels().find((panel) => panel.panelTitle === panelTitle);

            if (!panel) {
                return false;
            }

            return panel.filters.some((filter) => {
                return this.advancedFiltersForm.value[filter.formControlName];
            });
        }
    }

    // Update filter options with data from detailed buildings
    private updateFilterOptions(): void {
        if (this.detailedBuildings.length > 0) {
            const postcodes = this.#filterOptions.getAvailablePostcodes(this.detailedBuildings);

            const years = this.#filterOptions.getAvailableYears(this.detailedBuildings);

            this.generalFilters.update((filters) => {
                const updatedFilters = [...filters];

                const postcodeFilter = updatedFilters.find((f) => f.formControlName === 'PostCode');
                if (postcodeFilter) {
                    postcodeFilter.data = postcodes;
                }

                const yearFilter = updatedFilters.find((f) => f.formControlName === 'YearOfAssessment');
                if (yearFilter) {
                    yearFilter.data = years;
                }

                return updatedFilters;
            });
        }

        this.updateFilterEnabledState();
    }

    private updateFilterEnabledState(): void {
        if (this.detailedBuildings.length === 0) {
            // No data available, don't update enabled states
            return;
        }

        // Define property mapping for each filter type
        const propertyMapping = {
            BuiltForm: 'BuiltForm',
            WindowGlazing: 'WindowGlazing',
            WallConstruction: 'WallConstruction',
            WallInsulation: 'WallInsulation',
            FloorConstruction: 'FloorConstruction',
            FloorInsulation: 'FloorInsulation',
            RoofConstruction: 'RoofConstruction',
            RoofInsulationLocation: 'RoofInsulationLocation',
            RoofInsulationThickness: 'RoofInsulationThickness',
        };

        // Calculate filtered buildings based on current selections
        const filteredBuildings = this.filterDetailedBuildings();
        console.log('Filtered buildings count:', filteredBuildings.length);

        this.otherPanels().forEach((panel) => {
            panel.filters.forEach((filter) => {
                const controlName = filter.formControlName;
                const propertyName = propertyMapping[controlName as keyof typeof propertyMapping];

                if (propertyName) {
                    const validOptions = filter.data.filter((option) => this.#filterOptions.isValueInDataset(option, propertyName, filteredBuildings));

                    filter.validOptions = validOptions;

                    // For special cases (postcode, year, etc.)
                    if (controlName === 'PostCode') {
                        filter.validOptions = this.#filterOptions.getAvailablePostcodes(filteredBuildings);
                    } else if (controlName === 'YearOfAssessment') {
                        filter.validOptions = this.#filterOptions.getAvailableYears(filteredBuildings);
                    } else if (controlName === 'EPCExpiry') {
                        const validExpiry: string[] = [];
                        const tenYearsAgo = new Date();
                        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

                        const expiredEPCValid = filteredBuildings.some((b) => b.LodgementDate && new Date(b.LodgementDate) < tenYearsAgo);
                        const inDateEPCValid = filteredBuildings.some((b) => b.LodgementDate && new Date(b.LodgementDate) >= tenYearsAgo);

                        if (expiredEPCValid) validExpiry.push('EPC Expired');
                        if (inDateEPCValid) validExpiry.push('EPC In Date');

                        filter.validOptions = validExpiry;
                    }
                }
            });
        });

        // Check if we have any valid filter options
        this.noValidFilterOptions = this.otherPanels().every((panel) =>
            panel.filters.every((filter) => !filter.validOptions || filter.validOptions.length === 0),
        );
    }

    // Filter detailed buildings based on the current form values
    private filterDetailedBuildings(): BuildingModel[] {
        const formValue = this.advancedFiltersForm.value;
        const filterKeys = Object.keys(formValue).filter((key) => formValue[key] && Array.isArray(formValue[key]) && formValue[key].length > 0);

        if (filterKeys.length === 0) {
            return this.detailedBuildings;
        }

        console.log('Active filters:', filterKeys);
        console.log(
            'Filter values:',
            filterKeys.map((key) => ({ [key]: formValue[key] })),
        );

        return this.detailedBuildings.filter((building) => {
            return filterKeys.every((key) => {
                if (!formValue[key] || formValue[key].length === 0) {
                    return true;
                }

                // Special handling for EPCExpiry
                if (key === 'EPCExpiry') {
                    const tenYearsAgo = new Date();
                    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

                    if (!building.LodgementDate) {
                        return false;
                    }

                    const lodgementDate = new Date(building.LodgementDate);
                    const isExpired = lodgementDate < tenYearsAgo;

                    return (formValue[key].includes('EPC Expired') && isExpired) || (formValue[key].includes('EPC In Date') && !isExpired);
                }

                const propertyValue = building[key as keyof BuildingModel];

                return (
                    propertyValue !== undefined &&
                    formValue[key].some((filterValue: string) => String(propertyValue).toLowerCase() === String(filterValue).toLowerCase())
                );
            });
        });
    }

    public updateWithNewBuildings(buildings: BuildingModel[]): void {
        console.log('Updating with new buildings:', buildings.length);
        this.detailedBuildings = buildings;
        this.updateFilterOptions();
    }

    public applyFilters(): void {
        const filteredBuildings = this.filterDetailedBuildings();

        console.log(`Applying filters: Found ${filteredBuildings.length} buildings matching criteria`);

        if (filteredBuildings.length > 0) {
            // Convert to BuildingMap format
            const buildingMap: Record<string, BuildingModel[]> = {};

            filteredBuildings.forEach((building) => {
                const toid = building.TOID ?? building.ParentTOID;
                if (!toid) return;

                if (buildingMap[toid]) {
                    buildingMap[toid].push(building);
                } else {
                    buildingMap[toid] = [building];
                }
            });

            // Set the buildings selection to display in results panel
            this.#dataService.setSelectedBuildings(Object.values(buildingMap));

            this.#dialogRef.close({
                value: this.advancedFiltersForm.value,
                filteredBuildings: buildingMap,
            });
        } else {
            console.log('No buildings match the selected filters');
            this.#dialogRef.close({ value: this.advancedFiltersForm.value });
        }
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
