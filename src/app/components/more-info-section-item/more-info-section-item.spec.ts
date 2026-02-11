import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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

    it('should not add the subtitle when it is not provided', () => {
        const subtitleElement = fixture.debugElement.query(By.css('.section-item-subtitle'));
        expect(subtitleElement).toBeFalsy();
    });

    it('should add the subtitle when it is provided', async () => {
        const testSubtitleText = 'Test subtitle';
        component.subtitle = testSubtitleText;

        fixture.detectChanges();
        await fixture.whenStable();

        const subtitleElement = fixture.debugElement.query(By.css('.section-item-subtitle')).nativeElement;
        expect(subtitleElement.textContent).toBe(testSubtitleText);
    });

    it('should change icon when the section item is clicked', async () => {
        const toggleIconElement = fixture.debugElement.query(By.css('[data-testid="section-item-toggle-icon"]')).nativeElement;
        expect(toggleIconElement.textContent.trim()).toBe('arrow_drop_down');

        const sectionItemHeaderContainer = fixture.debugElement.query(By.css('.section-item-header-container')).nativeElement;
        sectionItemHeaderContainer.click();

        fixture.detectChanges();

        expect(toggleIconElement.textContent.trim()).toBe('arrow_drop_up');
    });

    it('should not create the warning icon when warn is false', () => {
        const warningIconElement = fixture.debugElement.query(By.css('.section-item-warning-icon'));
        expect(warningIconElement).toBeFalsy();
    });

    it('should create the warning icon when warn is true', async () => {
        component.warn = true;

        fixture.detectChanges();
        await fixture.whenStable();

        const warningIconElement = fixture.debugElement.query(By.css('.section-item-warning-icon')).nativeElement;

        expect(warningIconElement.textContent.trim()).toBe('warning_amber');
    });
});
