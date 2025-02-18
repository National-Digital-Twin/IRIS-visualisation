import { TestBed } from '@angular/core/testing';
import { DataDownloadService } from './data-download.service';
import { writeFileXLSX, utils } from 'xlsx';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

const dummyBuildingXlsx = {
  UPRN: '001',
  TOID: 'abc',
  ParentTOID: 'p-1',
  FullAddress: 'Address',
  PostCode: '12345',
  PropertyType: 'Type',
  BuildForm: 'Form',
  InspectionDate: '2025-02-17T00:00:00.000Z',
  YearOfAssessment: '2025',
  EPC: 'A',
  SAPPoints: 100,
  FloorConstruction: 'Concrete',
  FloorInsulation: 'Yes',
  RoofConstruction: 'Tile',
  RoofInsulationLocation: 'Under',
  RoofInsulationThickness: '5cm',
  WallConstruction: 'Brick',
  WallInsulation: 'Yes',
  WindowGlazing: 'Double',
  Flagged: 'No',
} as any;

const dummyBuildingCSV = {
  UPRN: '001',
  TOID: 'abc',
  FullAddress: 'Dummy Address',
  PostCode: 'dummy',
} as any;

describe('DataDownloadService', () => {
  let service: DataDownloadService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataDownloadService],
    });
    service = TestBed.inject(DataDownloadService);
  });

  describe('downloadXlsxData', () => {
    it('should generate an XLSX file and call writeFileXLSX with a proper filename', () => {
      const writeFileSpy = jest
        .spyOn(require('xlsx'), 'writeFileXLSX')
        .mockImplementation(() => {});

      service.downloadXlsxData([dummyBuildingXlsx]);

      expect(writeFileSpy).toHaveBeenCalled();

      const filename: string = writeFileSpy.mock.calls[0][1] as string;
      expect(filename).toMatch(/^iris-download-.*\.xlsx$/);
    });
  });

  describe('downloadCSVData', () => {
    it('should generate a CSV Blob, create a zip file, and trigger download using saveAs', async () => {
      const saveAsSpy = jest
        .spyOn(require('file-saver'), 'saveAs')
        .mockImplementation(() => {});

      const generateAsyncSpy = jest
        .spyOn(JSZip.prototype, 'generateAsync')
        .mockResolvedValue(
          new Blob(['zipcontent'], { type: 'application/zip' })
        );

      service.downloadCSVData([dummyBuildingCSV]);

      await generateAsyncSpy.mock.results[0].value;

      expect(saveAsSpy).toHaveBeenCalled();
      const zipFilename: string = saveAsSpy.mock.calls[0][1] as string;
      expect(zipFilename).toMatch(/^iris-download-.*\.zip$/);
    });
  });
});
