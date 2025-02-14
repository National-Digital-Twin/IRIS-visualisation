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
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle panelOpen and emit updatePanelStatus on togglePanel', () => {
    const emitSpy = jest.spyOn(component.updatePanelStatus, 'emit');

    expect(component.panelOpen).toBe(true);

    component.togglePanel();
    expect(component.panelOpen).toBe(false);
    expect(emitSpy).toHaveBeenCalledWith(false);

    component.togglePanel();
    expect(component.panelOpen).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith(true);
  });

  it('should reset panelOpen to true and emit updatePanelStatus on ngOnDestroy', () => {
    const emitSpy = jest.spyOn(component.updatePanelStatus, 'emit');

    component.panelOpen = false;
    component.ngOnDestroy();

    expect(component.panelOpen).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith(true);
  });
});
