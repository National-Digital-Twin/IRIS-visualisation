import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { DownloadableContentModal } from './downloadable-content-modal';

describe('DownloadableContentModal', () => {
    let component: DownloadableContentModal;
    let fixture: ComponentFixture<DownloadableContentModal>;

    /* eslint-disable @typescript-eslint/explicit-function-return-type */
    const dialogMock = {
        close: () => {},
        open: () => {},
        afterClosed: () => {
            return of(true);
        },
    };

    /* eslint-enable @typescript-eslint/explicit-function-return-type */

    beforeEach(async () => {
        const dialogData = {
            pdfFilename: 'test.pdf',
            content: '<p>testing works</p>',
        };

        await TestBed.configureTestingModule({
            imports: [DownloadableContentModal, MatDialogModule],
            providers: [
                { provide: MatDialogRef, useValue: dialogMock },
                { provide: MAT_DIALOG_DATA, useValue: dialogData },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(DownloadableContentModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', async () => {
        expect(component).toBeTruthy();
    });

    it('should set pdf file path and name when pdf filepath and pdf filename are provided', async () => {
        expect(component.pdfFilePathAndName).toBe('../../../assets/test.pdf');
    });

    it('should add the download button when pdf filepath and name is set', async () => {
        const downloadButtonElement = fixture.debugElement.query(By.css('[data-testid="download-button"]')).nativeElement;
        expect(downloadButtonElement).toBeTruthy();
    });

    it('should add the hidden download link when pdf filepath and name is set', async () => {
        const downloadLinkElement = fixture.debugElement.query(By.css('#downloadLink')).nativeElement;
        expect(downloadLinkElement).toBeTruthy();
    });
});
