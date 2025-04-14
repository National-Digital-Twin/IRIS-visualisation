import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BuildingModel } from '@core/models/building.model';
import { FlagModalComponent, FlagModalData } from './flag.modal.component';

describe('FlagModalComponent', () => {
    let component: FlagModalComponent;
    let fixture: ComponentFixture<FlagModalComponent>;

    const mockData: FlagModalData = [{ UPRN: '123', FullAddress: '123 Main St' } as BuildingModel];

    const constantDate = new Date('2020-01-01T12:00:00Z');
    const expectedDate = constantDate.toLocaleDateString('en-GB');

    beforeEach(async () => {
        jest.spyOn(Date, 'now').mockReturnValue(constantDate.getTime());

        await TestBed.configureTestingModule({
            imports: [FlagModalComponent],
            providers: [{ provide: MAT_DIALOG_DATA, useValue: mockData }],
        }).compileComponents();

        fixture = TestBed.createComponent(FlagModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should expose the injected MAT_DIALOG_DATA via the data getter', () => {
        expect(component.data).toEqual(mockData);
    });

    it('should set today as a formatted date string in en-GB format', () => {
        expect(component.today).toEqual(expectedDate);
    });
});
