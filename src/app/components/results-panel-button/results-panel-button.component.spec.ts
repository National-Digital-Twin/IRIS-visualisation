import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultsPanelButtonComponent } from './results-panel-button.component';

describe('ResultsPanelButtonComponent', () => {
    let component: ResultsPanelButtonComponent;
    let fixture: ComponentFixture<ResultsPanelButtonComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ResultsPanelButtonComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ResultsPanelButtonComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('numberResults', 10);
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle open / closed when togglePanel is called', () => {
        const panelStatusSpy = jest.spyOn(component.updatePanelStatus, 'emit');

        expect(component.panelOpen).toBe(true);

        component.togglePanel();
        expect(component.panelOpen).toBe(false);
        expect(panelStatusSpy).toHaveBeenCalledWith(false);

        component.togglePanel();
        expect(component.panelOpen).toBe(true);
        expect(panelStatusSpy).toHaveBeenCalledWith(true);
    });

    it('should reset state on destroy', () => {
        const panelStatusSpy = jest.spyOn(component.updatePanelStatus, 'emit');

        component.panelOpen = false;
        component.ngOnDestroy();

        expect(component.panelOpen).toBe(true);
        expect(panelStatusSpy).toHaveBeenCalledWith(true);
    });
});
