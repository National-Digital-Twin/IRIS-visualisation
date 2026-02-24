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

    async function setupTest(pdfFilepath?: string, pdfFilename?: string): Promise<void> {
        const dialogData = {
            pdfFilepath,
            pdfFilename,
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
    }

    it('should create', async () => {
        await setupTest();
        expect(component).toBeTruthy();
    });

    it('should set pdf file path and name to undefined if pdf filepath is not provided', async () => {
        await setupTest(undefined, 'test.pdf');
        expect(component.pdfFilePathAndName).toBeUndefined();
    });

    it('should set pdf file path and name to undefined if pdf filename is not provided', async () => {
        await setupTest('test/folder', undefined);
        expect(component.pdfFilePathAndName).toBeUndefined();
    });

    it('should set pdf file path and name when pdf filepath and pdf filename are provided', async () => {
        await setupTest('test/folder', 'test.pdf');
        expect(component.pdfFilePathAndName).toBe('test/folder/test.pdf');
    });

    it('should not add the download button when pdf filepath and name is not set', async () => {
        await setupTest();
        const downloadButtonElement = fixture.debugElement.query(By.css('[data-testid="download-button"]'));
        expect(downloadButtonElement).toBeFalsy();
    });

    it('should not add the hidden download link when pdf filepath and name is not set', async () => {
        await setupTest();
        const downloadLinkElement = fixture.debugElement.query(By.css('#downloadLink'));
        expect(downloadLinkElement).toBeFalsy();
    });

    it('should add the download button when pdf filepath and name is set', async () => {
        await setupTest('test/folder', 'test.pdf');

        const downloadButtonElement = fixture.debugElement.query(By.css('[data-testid="download-button"]')).nativeElement;
        expect(downloadButtonElement).toBeTruthy();
    });

    it('should add the hidden download link when pdf filepath and name is set', async () => {
        await setupTest('test/folder', 'test.pdf');

        const downloadLinkElement = fixture.debugElement.query(By.css('#downloadLink')).nativeElement;
        expect(downloadLinkElement).toBeTruthy();
    });
});
