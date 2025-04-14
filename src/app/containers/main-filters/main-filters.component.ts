import { CommonModule } from '@angular/common';
import { Component, DestroyRef, InputSignal, OutputEmitterRef, WritableSignal, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LabelComponent } from '@components/label/label.component';
import { FilterPanelComponent } from '@containers/filter-panel/filter-panel.component';
import {
    BuiltForm,
    EPCRating,
    FloorConstruction,
    FloorInsulation,
    PostCode,
    StructureUnitType,
    RoofConstruction,
    RoofInsulationLocation,
    RoofInsulationThickness,
    WallConstruction,
    WallInsulation,
    WindowGlazing,
    YearOfAssessment,
} from '@core/enums';
import { AddressSearchData } from '@core/models/address-search-results.model';
import { AdvancedFiltersFormModel, EPCExpiry, FilterProps } from '@core/models/advanced-filters.model';
import { AddressSearchService } from '@core/services/address-search.service';
import { MapService } from '@core/services/map.service';
import { SpatialQueryService } from '@core/services/spatial-query.service';
import { LngLat } from 'mapbox-gl';
import { catchError, debounceTime, filter, map, of, switchMap } from 'rxjs';

@Component({
    selector: 'c477-main-filters',
    imports: [
        CommonModule,
        LabelComponent,
        MatAutocompleteModule,
        MatBadgeModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatSlideToggleModule,
        ReactiveFormsModule,
    ],
    templateUrl: './main-filters.component.html',
    styleUrl: './main-filters.component.scss',
    providers: [{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }],
})
export class MainFiltersComponent {
    readonly #fb: FormBuilder = inject(FormBuilder);
    readonly #dialog = inject(MatDialog);
    readonly #addressSearchService = inject(AddressSearchService);
    readonly #mapService = inject(MapService);
    readonly #spatialQueryService = inject(SpatialQueryService);
    readonly #destroyRef = inject(DestroyRef);

    public addressForm: FormGroup;
    public epcRatings: Record<string, string> = EPCRating;
    public numberFilters: number = 0;
    public propertyTypes: Record<string, string> = StructureUnitType;
    public addressOptions: WritableSignal<AddressSearchData[]> = signal([]);

    private advancedFiltersForm?: FormGroup;

    public filterProps: InputSignal<FilterProps> = input.required();

    public addressSelected: OutputEmitterRef<string> = output();
    public clearAllFilters: OutputEmitterRef<void> = output();
    public setAdvancedFilters: OutputEmitterRef<AdvancedFiltersFormModel> = output();
    public setRouteParams: OutputEmitterRef<Record<string, string[]>> = output();

    constructor() {
        const addressSearch = new FormControl('');
        this.addressForm = new FormGroup({ addressSearch });

        this.addressForm.valueChanges
            .pipe(
                map((result) => this.selectAddress(result.addressSearch)),
                takeUntilDestroyed(this.#destroyRef),
            )
            .subscribe();

        addressSearch.valueChanges
            .pipe(
                debounceTime(500),
                filter((value) => typeof value === 'string'),
                switchMap((value) => this.#addressSearchService.getAddresses(value as string).pipe(catchError(() => of([])))),
                map((result) => this.addressOptions.set(result)),
                takeUntilDestroyed(this.#destroyRef),
            )
            .subscribe();

        effect(() => {
            const filterProps = this.filterProps();

            if (!filterProps) {
                return;
            }

            this.advancedFiltersForm = this.createForm();
        });
    }

    public getKeys(options: Record<string, string>): string[] {
        return Object.keys(options);
    }

    /**
     * Remove postcode from address string
     * to prevent titlecase applying
     * @param address string
     * @returns substring without last item
     */
    public removePostCode(address: string): string {
        const lastIndex = address.lastIndexOf(',');
        return address.substring(0, lastIndex);
    }

    /**
     * set the autocomplete option value to
     * be either postcode or address
     * @param value option value
     * @returns string to use as option value
     */
    public getOptionValue(value: AddressSearchData): string {
        return value.ADDRESS !== '' ? value.ADDRESS : value.POSTCODE;
    }

    /**
     * if the address has been selected in the autocomplete zoom to that
     * @param result AddressSearchData (optional)
     * @returns substring without last item
     */
    public selectAddress(result: AddressSearchData): void {
        if (!result.ADDRESS) {
            return;
        }

        const coords: LngLat = new LngLat(result.LNG, result.LAT);
        const map = this.#mapService.zoomToCoords(coords);
        map.once('movestart', () => this.addressSelected.emit(''));
        map.once('moveend', () => this.addressSelected.emit(result.TOPOGRAPHY_LAYER_TOID));
    }

    public openAdvancedFilters(): void {
        const dialogRef = this.#dialog.open(FilterPanelComponent, {
            panelClass: 'filter-panel',
            width: '90%',
            maxWidth: '60rem',
            data: {
                filterProps: this.filterProps(),
                form: this.advancedFiltersForm,
            },
        });

        dialogRef.afterClosed().subscribe((res) => {
            console.log(res);
            if (res?.value) {
                this.setAdvancedFilters.emit(res.value);
            } else if (res?.clear) {
                this.numberFilters = 0;
                this.setAdvancedFilters.emit({
                    PostCode: [],
                    BuiltForm: [],
                    WindowGlazing: [],
                    WallConstruction: [],
                    WallInsulation: [],
                    FloorConstruction: [],
                    FloorInsulation: [],
                    RoofConstruction: [],
                    RoofInsulationLocation: [],
                    RoofInsulationThickness: [],
                    YearOfAssessment: [],
                    EPCExpiry: [],
                });
            } else {
                // reset the form to the original values on cancel
                this.createForm();
            }
        });
    }

    private countFilters(formValue: AdvancedFiltersFormModel): number {
        return Object.keys(formValue).reduce((acc, val) => {
            return acc + (formValue[val as keyof AdvancedFiltersFormModel]?.length ?? 0);
        }, 0);
    }

    public propertyTypeChange(e: MatSelectChange): void {
        this.setRouteParams.emit({ StructureUnitType: e.value });
    }

    public ratingChange(e: MatSelectChange): void {
        this.setRouteParams.emit({ EPC: e.value.map((r: string) => r) });
    }

    public flaggedFilterChange(e: MatSlideToggleChange): void {
        if (e.checked) {
            this.setRouteParams.emit({ Flagged: ['true'] });
        } else {
            this.setRouteParams.emit({ Flagged: [] });
        }
    }

    private createForm(): FormGroup {
        const filterProps = this.filterProps();

        this.advancedFiltersForm = this.#fb.group<AdvancedFiltersFormModel>({
            PostCode: [filterProps.PostCode as unknown as PostCode],
            BuiltForm: [filterProps.BuiltForm as unknown as BuiltForm],
            YearOfAssessment: [filterProps.YearOfAssessment as unknown as YearOfAssessment],
            WindowGlazing: [filterProps.WindowGlazing as unknown as WindowGlazing],
            WallConstruction: [filterProps.WallConstruction as unknown as WallConstruction],
            WallInsulation: [filterProps.WallInsulation as unknown as WallInsulation],
            FloorConstruction: [filterProps.FloorConstruction as unknown as FloorConstruction],
            FloorInsulation: [filterProps.FloorInsulation as unknown as FloorInsulation],
            RoofConstruction: [filterProps.RoofConstruction as unknown as RoofConstruction],
            RoofInsulationLocation: [filterProps.RoofInsulationLocation as unknown as RoofInsulationLocation],
            RoofInsulationThickness: [filterProps.RoofInsulationThickness as unknown as RoofInsulationThickness],
            EPCExpiry: [filterProps.EPCExpiry as unknown as EPCExpiry],
        });
        this.numberFilters = this.countFilters(this.advancedFiltersForm.value);
        return this.advancedFiltersForm;
    }

    public clearEPC($event: Event): void {
        $event.stopPropagation();
        this.setRouteParams.emit({ EPC: [] });
    }

    public clearPropertyType($event: Event): void {
        $event.stopPropagation();
        this.setRouteParams.emit({ StructureUnitType: [] });
    }

    public clearAll(): void {
        this.numberFilters = 0;
        this.advancedFiltersForm?.reset();
        this.clearAllFilters.emit();
    }

    public filtersExist(): boolean {
        const filterProps = this.filterProps();
        return (filterProps && Object.keys(filterProps).length > 0) || this.#spatialQueryService.spatialFilterEnabled();
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
