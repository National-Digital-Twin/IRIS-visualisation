import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { BuildingModel } from '@core/models/building.model';
import { BuildingWeatherDataModel } from '@core/models/building.weather.data.model';
import fileSaver from 'file-saver';
import * as JSZip from 'jszip';
import xlsx from 'xlsx';
import { DataDownloadService } from './data-download.service';

const mockBuilding = { UPRN: '1' } as BuildingModel;
const mockBuildingWeatherData = { uprn: '1' } as BuildingWeatherDataModel;
const uprnsForBulkDownload = ['1'];

describe('DataDownloadService', () => {
    let service: DataDownloadService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [DataDownloadService, provideHttpClientTesting(), provideHttpClient()],
        });

        service = TestBed.inject(DataDownloadService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('downloadXlsxData', () => {
        it('should generate an XLSX file', () => {
            const writeFileSpy = jest.spyOn(xlsx, 'writeFileXLSX').mockImplementation(() => {});

            service.downloadXlsxData([mockBuilding], [mockBuildingWeatherData]);

            expect(writeFileSpy).toHaveBeenCalled();

            const filename: string = writeFileSpy.mock.calls[0][1] as string;
            expect(filename).toMatch(/^iris-download-.*\.xlsx$/);
        });
    });

    describe('bulkDownloadXlsxData', () => {
        it('should generate an XLSX file', () => {
            service.bulkDownloadXlsxData(uprnsForBulkDownload);

            const writeFileSpy = jest.spyOn(xlsx, 'writeFileXLSX').mockImplementation(() => {});

            expect(writeFileSpy).toHaveBeenCalled();

            const filename: string = writeFileSpy.mock.calls[0][1] as string;
            expect(filename).toMatch(/^iris-download-.*\.xlsx$/);
        });
    });

    describe('downloadCSVData', () => {
        it('should generate a CSV file', async () => {
            const saveAsSpy = jest.spyOn(fileSaver, 'saveAs').mockImplementation(() => {});

            const generateAsyncSpy = jest.spyOn(JSZip.prototype, 'generateAsync').mockResolvedValue(new Blob(['zipcontent'], { type: 'application/zip' }));

            service.downloadCSVData([mockBuilding], [mockBuildingWeatherData]);

            await generateAsyncSpy.mock.results[0].value;

            expect(saveAsSpy).toHaveBeenCalled();
            const zipFilename: string = saveAsSpy.mock.calls[0][1] as string;
            expect(zipFilename).toMatch(/^iris-download-.*\.zip$/);
        });
    });

    describe('bulkDownloadCSVData', () => {
        it('should generate a CSV file', async () => {
            waitForAsync(() => service.bulkDownloadCSVData(uprnsForBulkDownload));

            const saveAsSpy = jest.spyOn(fileSaver, 'saveAs').mockImplementation(() => {});

            const generateAsyncSpy = jest.spyOn(JSZip.prototype, 'generateAsync').mockResolvedValue(new Blob(['zipcontent'], { type: 'application/zip' }));

            await generateAsyncSpy.mock.results[0].value;

            expect(saveAsSpy).toHaveBeenCalled();
            const zipFilename: string = saveAsSpy.mock.calls[0][1] as string;
            expect(zipFilename).toMatch(/^iris-download-.*\.zip$/);
        });
    });
});
