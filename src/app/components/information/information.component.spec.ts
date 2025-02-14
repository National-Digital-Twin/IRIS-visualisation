import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Renderer2 } from '@angular/core';
import { InformationComponent } from './information.component';

describe('InformationComponent', () => {
  let component: InformationComponent;
  let fixture: ComponentFixture<InformationComponent>;

  let fakeAnchor: {
    setAttribute: jest.Mock;
    click: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    fakeAnchor = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      remove: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [InformationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InformationComponent);
    component = fixture.componentInstance;

    const renderer = fixture.debugElement.injector.get(Renderer2);
    jest.spyOn(renderer, 'createElement').mockReturnValue(fakeAnchor);

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger the download of the user guide when downloadUserGuide is called', () => {
    component.downloadUserGuide();

    const renderer = fixture.debugElement.injector.get(Renderer2);
    expect(renderer.createElement).toHaveBeenCalledWith('a');

    expect(fakeAnchor.setAttribute).toHaveBeenCalledWith('target', '_self');
    expect(fakeAnchor.setAttribute).toHaveBeenCalledWith(
      'href',
      'assets/C477 - IRIS user guide v2.pdf'
    );
    expect(fakeAnchor.setAttribute).toHaveBeenCalledWith(
      'download',
      'C477 - IRIS user guide v2.pdf'
    );

    expect(fakeAnchor.click).toHaveBeenCalled();
    expect(fakeAnchor.remove).toHaveBeenCalled();
  });
});
