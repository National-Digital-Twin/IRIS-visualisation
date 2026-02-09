import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoreInfoSection } from './more-info-section';

describe('MoreInfoSection', () => {
    let component: MoreInfoSection;
    let fixture: ComponentFixture<MoreInfoSection>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MoreInfoSection],
        }).compileComponents();

        fixture = TestBed.createComponent(MoreInfoSection);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
