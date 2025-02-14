import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LabelComponent } from './label.component';

describe('LabelComponent', () => {
  let component: LabelComponent;
  let fixture: ComponentFixture<LabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.epcRating).toBeUndefined();
    expect(component.sapPoints).toBeUndefined();
    expect(component.expired).toEqual(false);
  });

  it('should update input values correctly', () => {
    component.epcRating = 'B';
    component.sapPoints = '85';
    component.expired = true;
    fixture.detectChanges();

    expect(component.epcRating).toEqual('B');
    expect(component.sapPoints).toEqual('85');
    expect(component.expired).toEqual(true);
  });
});
