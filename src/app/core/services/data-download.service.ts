import { Injectable } from '@angular/core';
import { BuildingModel } from '@core/models/building.model';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { utils, writeFileXLSX } from 'xlsx';

@Injectable({
    providedIn: 'root',
})
export class DataDownloadService {
    private warning = `
      Warning: The downloaded data is static and will not refresh after download. We advise using the tool for accessing the most current data available.
      The data you have downloaded represents a point-in-time snapshot and will not reflect real-time updates or changes. It is valid and accurate only at the moment of download.
      Any subsequent updates or modifications made to the original dataset will not be reflected in this downloaded version.
      Please ensure that you verify the currency of the data for your specific needs. We recommend referring back to the online version or consulting the relevant authoritative sources for the most up-to-date information.
  `;

    public downloadXlsxData(data: BuildingModel[]): void {
        const dateData = data.map((d) => ({
            ...d,
            InspectionDate: d.InspectionDate ? new Date(d.InspectionDate) : '',
        }));
        const ws = utils.json_to_sheet(dateData, {
            cellDates: true,
            header: [
                'UPRN',
                'TOID',
                'ParentTOID',
                'FullAddress',
                'PostCode',
                'PropertyType',
                'BuildForm',
                'InspectionDate',
                'YearOfAssessment',
                'EPC',
                'SAPPoints',
                'FloorConstruction',
                'FloorInsulation',
                'RoofConstruction',
                'RoofInsulationLocation',
                'RoofInsulationThickness',
                'WallConstruction',
                'WallInsulation',
                'WindowGlazing',
                'Flagged',
            ],
        });
        const warningWS = utils.aoa_to_sheet([[this.warning]]);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, warningWS, 'WARNING');
        utils.book_append_sheet(wb, ws, 'Data');
        const filename = this.generateFileName() + '.xlsx';
        writeFileXLSX(wb, filename);
    }

    /**
     * Format data into blob url & download by adding a link to the document
     * @param data the data to be downloaded as an object
     * @returns void
     */
    public downloadCSVData(data: BuildingModel[]): void {
        const csvBlob = this.formatDataForCSV(data);
        this.createZipFile(csvBlob);
    }

    private generateFileName(): string {
        return 'iris-download-' + new Date().toISOString().replaceAll(':', '_').replaceAll('.', '_');
    }

    /**
     * Stringify the data, add newlines and convert to blob
     * @param buildings the array of objects to be formatted & blobified
     * @returns a csv compliant blob of the data
     */
    private formatDataForCSV(buildings: BuildingModel[]): Blob {
        const csvRows = [];
        const headers = Object.keys(buildings[0]);
        csvRows.push(headers.join(','));
        for (const building of buildings) {
            const values = headers.map((header) => {
                // eslint-disable-next-line
                //@ts-ignore
                const val = building[header];
                return `"${val}"`;
            });
            csvRows.push(values.join(','));
        }
        const data = csvRows.join('\n');
        const blob = new Blob([data], {
            type: 'text/csv;charset=utf-8,',
        });
        return blob;
    }

    private createZipFile(csvBlob: Blob): void {
        const filename = this.generateFileName();

        const warning = new Blob([this.warning], { type: 'text/plain' });
        const zip = new JSZip();
        zip.file(filename + '.csv', csvBlob);
        zip.file('warning.txt', warning);
        zip.generateAsync({ type: 'blob' }).then((content) => {
            saveAs(content, filename + '.zip');
        });
    }
}
