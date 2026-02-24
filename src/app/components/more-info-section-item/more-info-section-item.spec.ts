import { inputBinding, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MoreInfoSectionItem } from './more-info-section-item';

describe('MoreInfoSectionItem', () => {
    let component: MoreInfoSectionItem;
    let fixture: ComponentFixture<MoreInfoSectionItem>;
    let sanitizer: DomSanitizer;

    const headerInput = signal<string>('Test Section Item');
    const subtitleInput = signal<string | undefined>(undefined);
    const warnInput = signal<boolean>(false);
    const downloadableWarningGuidanceMoreInfoInput = signal<{ pdfFilepath: string; pdfFilename: string; content: SafeHtml } | undefined>(undefined);

    beforeEach(async () => {
        headerInput.set('Test Section Item');
        subtitleInput.set(undefined);
        warnInput.set(false);
        downloadableWarningGuidanceMoreInfoInput.set(undefined);

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: DomSanitizer,
                    useValue: {
                        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
                        bypassSecurityTrustHtml: (val: string) => val,
                    },
                },
            ],
            imports: [MoreInfoSectionItem],
        }).compileComponents();

        fixture = TestBed.createComponent(MoreInfoSectionItem, {
            bindings: [
                inputBinding('headerInput', headerInput),
                inputBinding('subtitleInput', subtitleInput),
                inputBinding('warnInput', warnInput),
                inputBinding('downloadableWarningGuidanceMoreInfoInput', downloadableWarningGuidanceMoreInfoInput),
            ],
        });
        component = fixture.componentInstance;
        fixture.detectChanges();

        sanitizer = TestBed.inject(DomSanitizer);
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
        subtitleInput.set(testSubtitleText);

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
        warnInput.set(true);

        fixture.detectChanges();
        await fixture.whenStable();

        const warningIconElement = fixture.debugElement.query(By.css('.section-item-warning-icon')).nativeElement;

        expect(warningIconElement.textContent.trim()).toBe('warning_amber');
    });

    it('should not add the downloadable more info warning guidance when it is not provided and warn is false', () => {
        const downloadableWarningGuidanceMoreInfoElement = fixture.debugElement.query(By.css('.section-item-warning-guidance-more-info'));
        expect(downloadableWarningGuidanceMoreInfoElement).toBeFalsy();
    });

    it('should not add the downloadable more info warning guidance when it is provided and warn is false', async () => {
        downloadableWarningGuidanceMoreInfoInput.set({
            pdfFilepath: 'test/folder',
            pdfFilename: 'testing.pdf',
            content: sanitizer.bypassSecurityTrustHtml('<p>tesing works</p>'),
        });

        fixture.detectChanges();
        await fixture.whenStable();

        const downloadableWarningGuidanceMoreInfoElement = fixture.debugElement.query(By.css('.section-item-warning-guidance-more-info'));
        expect(downloadableWarningGuidanceMoreInfoElement).toBeFalsy();
    });

    it('should not add the downloadable more info warning guidance when it is not provided and warn is true', async () => {
        warnInput.set(true);

        fixture.detectChanges();
        await fixture.whenStable();

        const downloadableWarningGuidanceMoreInfoElement = fixture.debugElement.query(By.css('.section-item-warning-guidance-more-info'));
        expect(downloadableWarningGuidanceMoreInfoElement).toBeFalsy();
    });

    it('should add the downloadable more info warning guidance when it is provided and warn is true', async () => {
        warnInput.set(true);
        downloadableWarningGuidanceMoreInfoInput.set({
            pdfFilepath: 'test/folder',
            pdfFilename: 'testing.pdf',
            content: sanitizer.bypassSecurityTrustHtml('<p>tesing works</p>'),
        });

        fixture.detectChanges();
        await fixture.whenStable();

        const downloadableWarningGuidanceMoreInfoElement = fixture.debugElement.query(
            By.css('.section-item-warning-guidance-more-info > strong'),
        ).nativeElement;
        expect(downloadableWarningGuidanceMoreInfoElement.textContent).toBe('For more information, please read here');
    });
});
