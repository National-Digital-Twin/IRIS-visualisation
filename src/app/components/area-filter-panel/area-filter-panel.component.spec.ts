import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AreaSelectionService } from '@core/services/area-selection.service';
import { of, throwError } from 'rxjs';
import { AreaFilterPanelComponent } from './area-filter-panel.component';

const mockRegions = ['North West', 'London', 'South East'];

describe('AreaFilterPanelComponent', () => {
    let component: AreaFilterPanelComponent;
    let fixture: ComponentFixture<AreaFilterPanelComponent>;
    let areaService: AreaSelectionService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AreaFilterPanelComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        fixture = TestBed.createComponent(AreaFilterPanelComponent);
        component = fixture.componentInstance;
        areaService = TestBed.inject(AreaSelectionService);
    });

    it('should create component', () => {
        expect(component).toBeTruthy();
    });

    describe('area level selection', () => {
        it('should call service when area level selected', () => {
            jest.spyOn(areaService, 'getAreasByLevel').mockReturnValue(of(mockRegions));
            fixture.detectChanges();

            const select = fixture.nativeElement.querySelector('mat-select') as HTMLElement;
            select.click();
            fixture.detectChanges();

            const options = document.querySelectorAll('mat-option');
            (options[0] as HTMLElement).click();
            fixture.detectChanges();

            expect(areaService.getAreasByLevel).toHaveBeenCalledWith('region');
        });

        it('should disable dropdown once area level is selected', () => {
            jest.spyOn(areaService, 'getAreasByLevel').mockReturnValue(of(mockRegions));
            fixture.detectChanges();

            const select = fixture.nativeElement.querySelector('mat-select');
            expect(select.getAttribute('aria-disabled')).toBe('false');

            select.click();
            fixture.detectChanges();

            const options = document.querySelectorAll('mat-option');
            (options[0] as HTMLElement).click();
            fixture.detectChanges();

            expect(select.getAttribute('aria-disabled')).toBe('true');
        });
    });

    describe('area loading', () => {
        it('should populate allAreas after fetch', () => {
            jest.spyOn(areaService, 'getAreasByLevel').mockReturnValue(of(mockRegions));

            component['areaLevel'].set('region');
            component['onAreaLevelChange']();

            expect(component['allAreas']()).toEqual(mockRegions);
        });

        it('should show no results when empty response', () => {
            jest.spyOn(areaService, 'getAreasByLevel').mockReturnValue(of([]));

            component['areaLevel'].set('ward');
            component['loadAreas']();
            fixture.detectChanges();

            const noResults = fixture.nativeElement.querySelector('.no-results');
            expect(noResults?.textContent).toContain('No results found');
        });

        it('should handle error', () => {
            jest.spyOn(areaService, 'getAreasByLevel').mockReturnValue(throwError(() => new Error('API error')));

            component['areaLevel'].set('region');
            component['loadAreas']();
            fixture.detectChanges();

            const spinner = fixture.nativeElement.querySelector('mat-spinner');
            expect(spinner).toBeFalsy();
        });
    });

    describe('search filtering', () => {
        beforeEach(() => {
            component['allAreas'].set(['North West', 'North East', 'South West', 'South East', 'London']);
        });

        it('should filter areas by search term', () => {
            component['searchTerm'].set('north');

            const filtered = component['filteredAreas']();

            expect(filtered).toEqual(['North West', 'North East']);
        });

        it('should be case insensitive', () => {
            component['searchTerm'].set('SOUTH');

            const filtered = component['filteredAreas']();

            expect(filtered).toEqual(['South West', 'South East']);
        });

        it('should show all areas when search is empty', () => {
            component['searchTerm'].set('');

            const filtered = component['filteredAreas']();

            expect(filtered.length).toBe(5);
        });
    });

    describe('event emissions', () => {
        it('should emit confirm with correct data', () => {
            const confirmSpy = jest.spyOn(component.confirm, 'emit');
            component['areaLevel'].set('region');
            component['selectedAreas'].set(new Set(['North West', 'London']));

            component['onConfirm']();

            expect(confirmSpy).toHaveBeenCalledWith({
                level: 'region',
                names: expect.arrayContaining(['North West', 'London']),
            });
        });

        it('should not emit confirm when no selections', () => {
            const confirmSpy = jest.spyOn(component.confirm, 'emit');
            component['areaLevel'].set('region');

            component['onConfirm']();

            expect(confirmSpy).not.toHaveBeenCalled();
        });

        it('should emit canceled on cancel', () => {
            const canceledSpy = jest.spyOn(component.canceled, 'emit');

            component['onCancel']();

            expect(canceledSpy).toHaveBeenCalled();
        });
    });

    describe('computed properties', () => {
        it('should compute maxSelections as 10 for regions', () => {
            component['areaLevel'].set('region');

            expect(component['maxSelections']()).toBe(10);
        });

        it('should compute maxSelections as 15 for non-regions', () => {
            component['areaLevel'].set('county');

            expect(component['maxSelections']()).toBe(15);
        });

        it('should compute isAtLimit correctly', () => {
            component['areaLevel'].set('region');
            component['selectedAreas'].set(new Set(Array.from({ length: 10 }, (_, i) => `Region ${i}`)));

            expect(component['isAtLimit']()).toBe(true);
        });
    });
});
