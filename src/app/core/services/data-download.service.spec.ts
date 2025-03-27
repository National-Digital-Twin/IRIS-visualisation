import { TestBed } from '@angular/core/testing';
import { BuildingModel } from '@core/models/building.model';
import fileSaver from 'file-saver';
import * as JSZip from 'jszip';
import xlsx from 'xlsx';
import { DataDownloadService } from './data-download.service';

const mockBuilding = { UPRN: '1' } as BuildingModel;

describe('DataDownloadService', () => {
    let service: DataDownloadService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [DataDownloadService],
        });

        service = TestBed.inject(DataDownloadService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('downloadXlsxData', () => {
        it('should generate an XLSX file', () => {
            const writeFileSpy = jest.spyOn(xlsx, 'writeFileXLSX').mockImplementation(() => {});

            service.downloadXlsxData([mockBuilding]);

            expect(writeFileSpy).toHaveBeenCalled();

            const filename: string = writeFileSpy.mock.calls[0][1] as string;
            expect(filename).toMatch(/^iris-download-.*\.xlsx$/);
        });
    });

    describe('downloadCSVData', () => {
        it('should generate a CSV file', async () => {
            const saveAsSpy = jest.spyOn(fileSaver, 'saveAs').mockImplementation(() => {});

            const generateAsyncSpy = jest.spyOn(JSZip.prototype, 'generateAsync').mockResolvedValue(new Blob(['zipcontent'], { type: 'application/zip' }));

            service.downloadCSVData([mockBuilding]);

            await generateAsyncSpy.mock.results[0].value;

            expect(saveAsSpy).toHaveBeenCalled();
            const zipFilename: string = saveAsSpy.mock.calls[0][1] as string;
            expect(zipFilename).toMatch(/^iris-download-.*\.zip$/);
        });
    });
});
