import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DownloadWarningComponent } from './download-warning.component';
import { DownloadDataWarningData } from '@core/models/download-data-warning.model';

describe('DownloadWarningComponent', () => {
  let component: DownloadWarningComponent;
  let fixture: ComponentFixture<DownloadWarningComponent>;

  const mockData: DownloadDataWarningData = {
    addresses: ['123 Main St', '456 Elm St'],
    addressCount: 2,
  };
 
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadWarningComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the injected MAT_DIALOG_DATA via the data getter', () => {
    expect(component.data).toEqual(mockData);
  });
});
