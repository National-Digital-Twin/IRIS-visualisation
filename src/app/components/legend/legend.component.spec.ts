import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LegendComponent } from './legend.component';

describe('LegendComponent', () => {
    let component: LegendComponent;
    let fixture: ComponentFixture<LegendComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LegendComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(LegendComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should have a defined epcItems array with 9 elements', () => {
        expect(component.epcItems).toBeDefined();
        expect(component.epcItems.length).toEqual(9);
    });

    it('should have the expected epcItems', () => {
        expect(component.epcItems).toEqual([
            { rating: 'A', sapPoints: '92 +' },
            { rating: 'B', sapPoints: '81-91' },
            { rating: 'C', sapPoints: '69-80' },
            { rating: 'D', sapPoints: '55-68' },
            { rating: 'E', sapPoints: '39-54' },
            { rating: 'F', sapPoints: '21-38' },
            { rating: 'G', sapPoints: '1-20' },
            { rating: 'none', sapPoints: '' },
            { rating: 'avg', sapPoints: '1-20' },
        ]);
    });
});
