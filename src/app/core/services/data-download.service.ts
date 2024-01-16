import { Injectable } from '@angular/core';
import {
  BuildingDetailsModel,
  BuildingMap,
  BuildingPart,
  BuildingPartMap,
  DownloadDataModel,
} from '@core/models/building.model';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class DataDownloadService {
  constructor() {}

  /**
   * Format data into blob url & download by adding a link to the document
   * @param data the data to be downloaded as an object
   * @returns void
   */
  downloadData(data: Partial<DownloadDataModel>): void {
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

  /**
   * Combine building details and parts into one object
   * @param details the building details
   * @param parts the building parts
   * @returns a flattened, combined object of building details & parts
   */
  combineDetailsAndParts(
    details: BuildingDetailsModel,
    parts: BuildingPartMap | undefined
  ): Partial<DownloadDataModel> {
    let detailsData = details as Partial<DownloadDataModel>;
    // remove parts as superceded by the full parts data
    delete detailsData.parts;
    if (parts) {
      // flatten parts into one object
      const partsArray = Object.keys(parts).map((key: keyof BuildingMap) => {
        const subParts = Object.keys(parts[key]).map(subKey => {
          return { [key + subKey]: parts[key][subKey as keyof BuildingPart] };
        });
        return Object.assign({}, ...subParts);
      });
      const flattenedParts = Object.assign({}, ...partsArray);
      detailsData = { ...detailsData, ...flattenedParts };
    }
    return detailsData;
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
  private formatDataForCSV(data: Partial<DownloadDataModel>): Blob {
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
}
