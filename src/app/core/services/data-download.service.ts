import { Injectable, inject } from '@angular/core';
import { BuildingModel } from '@core/models/building.model';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root',
})
export class DataDownloadService {
  private dataService = inject(DataService);

  /**
   * Format data into blob url & download by adding a link to the document
   * @param data the data to be downloaded as an object
   * @returns void
   */
  downloadData(data: BuildingModel): void {
    const csvBlob = this.formatDataForCSV(data);
    const filename =
      'iris-download-' +
      new Date().toISOString().replaceAll(':', '_').replaceAll('.', '_');
    const warning = this.generateWarning();
    const zip = new JSZip();
    zip.file(filename + '.csv', csvBlob);
    zip.file('warning.txt', warning);
    zip.generateAsync({ type: 'blob' }).then(content => {
      saveAs(content, filename + '.zip');
    });
  }

  downloadAll(uprns?: string[]) {
    const data = this.dataService.buildingsSelection();
    let selectedBuildings: BuildingModel[] = [];
    if (uprns?.length) {
      data!.flat().forEach(building => {
        if (uprns.includes(building.UPRN)) {
          selectedBuildings.push(building);
        } else {
          return;
        }
      });
    } else {
      selectedBuildings = data!.flat();
    }

    const csvBlob = this.arrayToCSV(selectedBuildings!.flat());
    const filename =
      'iris-download-' +
      new Date().toISOString().replaceAll(':', '_').replaceAll('.', '_');
    const warning = this.generateWarning();
    const zip = new JSZip();
    zip.file(filename + '.csv', csvBlob);
    zip.file('warning.txt', warning);
    zip.generateAsync({ type: 'blob' }).then(content => {
      saveAs(content, filename + '.zip');
    });
  }

  private generateWarning(): Blob {
    return new Blob(
      [
        `
      Warning: The downloaded data is static and will not refresh after download. We advise using the tool for accessing the most current data available.
      The data you have downloaded represents a point-in-time snapshot and will not reflect real-time updates or changes. It is valid and accurate only at the moment of download.
      Any subsequent updates or modifications made to the original dataset will not be reflected in this downloaded version.
      Please ensure that you verify the currency of the data for your specific needs. We recommend referring back to the online version or consulting the relevant authoritative sources for the most up-to-date information.
    `,
      ],
      { type: 'text/plain' }
    );
  }

  /**
   * Stringify the data, add newlines and convert to blob
   * @param data the object to be formatted & blobified
   * @returns a csv compliant blob of the data
   */
  private formatDataForCSV(data: BuildingModel): Blob {
    const headers = [...Object.keys(data)].join(',');
    const values = Object.values(data)
      // add quotes to keep address together
      .map(value => `"${value}"`)
      .join(',');
    const stringifiedData = headers + '\n' + values;
    const blob = new Blob([stringifiedData], {
      type: 'text/csv;charset=utf-8,',
    });
    return blob;
  }

  private arrayToCSV(buildings: BuildingModel[]): Blob {
    const csvRows = [];
    const headers = Object.keys(buildings[0]);
    csvRows.push(headers.join(','));
    for (const building of buildings) {
      const values = headers.map(header => {
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
}
