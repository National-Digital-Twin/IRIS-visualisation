import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoreInfoSectionItem } from './more-info-section-item';

describe('MoreInfoSectionItem', () => {
    let component: MoreInfoSectionItem;
    let fixture: ComponentFixture<MoreInfoSectionItem>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MoreInfoSectionItem],
        }).compileComponents();

        fixture = TestBed.createComponent(MoreInfoSectionItem);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
