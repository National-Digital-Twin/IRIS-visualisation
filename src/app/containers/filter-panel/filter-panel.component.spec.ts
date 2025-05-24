import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MAP_SERVICE } from '@core/services/map.token';
import { of } from 'rxjs';
import { FilterDialogData, FilterPanelComponent } from './filter-panel.component';
import { FilterPanel, FilterPanelService } from './filter-panel.service';

const mockPanelFilter: FilterPanel[] = [
    {
        title: 'General',
        keys: [],
        filters: [{ key: 'postcode', name: 'PostCode', label: 'Post code', values: ['AA11', 'AA12', 'AA13', 'AA14'], selected: [] }],
    },
    {
        title: 'Glazing',
        keys: [],
        filters: [{ key: 'window_glazing', name: 'WindowGlazing', label: 'Window glazing', values: ['Single', 'Double'], selected: [] }],
    },
    {
        title: 'Wall',
        keys: [],
        filters: [{ key: 'wall_construction', name: 'WallConstruction', label: 'Wall construction', values: ['Brick', 'Timber'], selected: [] }],
    },
    {
        title: 'Floor',
        keys: [],
        filters: [{ key: 'floor_construction', name: 'FloorConstruction', label: 'Floor construction', values: ['Carpet', 'Tiles'], selected: [] }],
    },
    {
        title: 'Roof',
        keys: [],
        filters: [{ key: 'roof_construction', name: 'RoofConstruction', label: 'Roof construction', values: ['Slate', 'Straw'], selected: [] }],
    },
];

const mockData: FilterDialogData = {
    filterProps: {
        PostCode: [],
        BuiltForm: [],
        YearOfAssessment: [],
        EPCExpiry: [],
        WindowGlazing: [],
        WallConstruction: [],
        WallInsulation: [],
        FloorConstruction: [],
        FloorInsulation: [],
        RoofConstruction: [],
        RoofInsulationLocation: [],
        RoofInsulationThickness: [],
        Flagged: [],
        StructureUnitType: [],
    },
};

describe('FilterPanelComponent', () => {
    let component: FilterPanelComponent;
    let fixture: ComponentFixture<FilterPanelComponent>;

    describe('there are no panels', () => {
        beforeEach(async () => {
            const mapService = { currentMapBounds: jest.fn().mockReturnValue({ getSouth: () => 1, getNorth: () => 2, getWest: () => 3, getEast: () => 4 }) };

            const filterPanelService = { retrieveFilterPanels: jest.fn().mockReturnValue(of([])) };

            await TestBed.configureTestingModule({
                imports: [FilterPanelComponent],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockData },
                    { provide: MAP_SERVICE, useValue: mapService },
                    { provide: MatDialogRef, useValue: {} },
                    { provide: FilterPanelService, useValue: filterPanelService },
                ],
            }).compileComponents();

            fixture = TestBed.createComponent(FilterPanelComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should create the component', () => {
            expect(component).toBeTruthy();
        });

        it('should display no accordion panels', () => {
            const element = fixture.nativeElement as HTMLElement;
            const content = element.querySelectorAll('mat-expansion-panel');
            expect(content.length).toEqual(0);
        });
    });

    describe('filter has no selections', () => {
        beforeEach(async () => {
            const mapService = { currentMapBounds: jest.fn().mockReturnValue({ getSouth: () => 1, getNorth: () => 2, getWest: () => 3, getEast: () => 4 }) };

            const mockPanelCopy = [...mockPanelFilter];
            const filterPanelService = { retrieveFilterPanels: jest.fn().mockReturnValue(of(mockPanelCopy)) };

            await TestBed.configureTestingModule({
                imports: [FilterPanelComponent],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockData },
                    { provide: MAP_SERVICE, useValue: mapService },
                    { provide: MatDialogRef, useValue: {} },
                    { provide: FilterPanelService, useValue: filterPanelService },
                ],
            }).compileComponents();

            fixture = TestBed.createComponent(FilterPanelComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should create the component', () => {
            expect(component).toBeTruthy();
        });

        it('should display accordion panels', () => {
            const element = fixture.nativeElement as HTMLElement;
            const content = element.querySelectorAll('mat-expansion-panel');
            expect(content.length).toEqual(5);

            expect(content.item(0).classList).toContain('mat-expanded');
            expect(content.item(1).classList).not.toContain('mat-expanded');
            expect(content.item(2).classList).not.toContain('mat-expanded');
            expect(content.item(3).classList).not.toContain('mat-expanded');
            expect(content.item(4).classList).not.toContain('mat-expanded');
        });
    });

    describe('filter has selections', () => {
        beforeEach(async () => {
            const mapService = { currentMapBounds: jest.fn().mockReturnValue({ getSouth: () => 1, getNorth: () => 2, getWest: () => 3, getEast: () => 4 }) };

            const mockPanelCopy = [...mockPanelFilter];
            mockPanelCopy[1].filters[0].selected = ['Single'];
            mockPanelCopy[4].filters[0].selected = ['Slate'];
            const filterPanelService = { retrieveFilterPanels: jest.fn().mockReturnValue(of(mockPanelCopy)) };

            await TestBed.configureTestingModule({
                imports: [FilterPanelComponent],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockData },
                    { provide: MAP_SERVICE, useValue: mapService },
                    { provide: MatDialogRef, useValue: {} },
                    { provide: FilterPanelService, useValue: filterPanelService },
                ],
            }).compileComponents();

            fixture = TestBed.createComponent(FilterPanelComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should create the component', () => {
            expect(component).toBeTruthy();
        });

        it('should display accordion panels', () => {
            const element = fixture.nativeElement as HTMLElement;
            const content = element.querySelectorAll('mat-expansion-panel');
            expect(content.length).toEqual(5);

            expect(content.item(0).classList).not.toContain('mat-expanded');
            expect(content.item(1).classList).toContain('mat-expanded');
            expect(content.item(2).classList).not.toContain('mat-expanded');
            expect(content.item(3).classList).not.toContain('mat-expanded');
            expect(content.item(4).classList).toContain('mat-expanded');
        });
    });

    describe('panel controls', () => {
        let dialogRef: MatDialogRef<FilterPanelComponent>;

        beforeEach(async () => {
            const mapService = { currentMapBounds: jest.fn().mockReturnValue({ getSouth: () => 1, getNorth: () => 2, getWest: () => 3, getEast: () => 4 }) };

            const mockDialogRef = { close: jest.fn() };

            const mockPanelCopy = [...mockPanelFilter];
            const filterPanelService = { retrieveFilterPanels: jest.fn().mockReturnValue(of(mockPanelCopy)) };

            await TestBed.configureTestingModule({
                imports: [FilterPanelComponent],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockData },
                    { provide: MAP_SERVICE, useValue: mapService },
                    { provide: MatDialogRef, useValue: mockDialogRef },
                    { provide: FilterPanelService, useValue: filterPanelService },
                ],
            }).compileComponents();

            dialogRef = TestBed.inject(MatDialogRef);
            fixture = TestBed.createComponent(FilterPanelComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should allow clearing of filters', () => {
            const element = fixture.nativeElement as HTMLElement;
            const buttons = element.querySelectorAll<HTMLButtonElement>('mat-dialog-actions > button');
            let target: HTMLButtonElement | undefined;

            buttons.forEach((button) => {
                if (button.textContent === 'Clear all') {
                    target = button;
                }
            });

            if (!target) {
                throw new Error('Button not found');
            }

            target.click();
            const closeSpy = jest.spyOn(dialogRef, 'close');
            expect(closeSpy).toHaveBeenCalledWith({ clear: true });
        });

        it('should allow cancel of dialog', () => {
            const element = fixture.nativeElement as HTMLElement;
            const buttons = element.querySelectorAll<HTMLButtonElement>('mat-dialog-actions > button');
            let target: HTMLButtonElement | undefined;

            buttons.forEach((button) => {
                if (button.textContent === 'Cancel') {
                    target = button;
                }
            });

            if (!target) {
                throw new Error('Button not found');
            }

            target.click();
            const closeSpy = jest.spyOn(dialogRef, 'close');
            expect(closeSpy).toHaveBeenCalledWith('');
        });

        it('should allow setting of filters', () => {
            const element = fixture.nativeElement as HTMLElement;
            const buttons = element.querySelectorAll<HTMLButtonElement>('mat-dialog-actions > button');
            let target: HTMLButtonElement | undefined;

            buttons.forEach((button) => {
                if (button.textContent === 'Apply filters') {
                    target = button;
                }
            });

            if (!target) {
                throw new Error('Button not found');
            }

            target.click();
            const closeSpy = jest.spyOn(dialogRef, 'close');
            expect(closeSpy).toHaveBeenCalledWith(component.filtersForm);
        });
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
