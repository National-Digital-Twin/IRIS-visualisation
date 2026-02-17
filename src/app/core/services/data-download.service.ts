import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BuiltForm, EPCRating, PostCode, StructureUnitType } from '@core/enums';
import { parseEPCRating, parsePostcode, parseBuiltForm } from '@core/helpers';
import { BuildingModel } from '@core/models/building.model';
import { BuildingWeatherDataModel } from '@core/models/building.weather.data.model';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { catchError, map, Observable, of } from 'rxjs';
import { utils, writeFileXLSX } from 'xlsx';

type BuildingDetails = {
    uprn: string;
    toid?: string;
    first_line_of_address?: string;
    post_code?: string;
    longitude: string;
    latitude: string;
    energy_rating?: string;
    lodgement_date?: string;
    sap_rating?: string;
    type?: string;
    built_form?: string;
    fuel_type?: string;
    floor_construction?: string;
    floor_insulation?: string;
    roof_construction?: string;
    roof_insulation_location?: string;
    roof_insulation_thickness?: string;
    wall_construction?: string;
    wall_insulation?: string;
    window_glazing?: string;
    roof_material?: string;
    solar_panel_presence?: string;
    roof_shape?: string;
    roof_aspect_area_facing_north_m2?: string;
    roof_aspect_area_facing_north_east_m2?: string;
    roof_aspect_area_facing_east_m2?: string;
    roof_aspect_area_facing_south_east_m2?: string;
    roof_aspect_area_facing_south_m2?: string;
    roof_aspect_area_facing_south_west_m2?: string;
    roof_aspect_area_facing_west_m2?: string;
    roof_aspect_area_facing_north_west_m2?: string;
    north_four_degrees_median: number;
    north_east_four_degrees_median: number;
    east_four_degrees_median: number;
    south_east_four_degrees_median: number;
    south_four_degrees_median: number;
    south_west_four_degrees_median: number;
    west_four_degrees_median: number;
    north_west_four_degrees_median: number;
    north_two_degrees_median: number;
    north_east_two_degrees_median: number;
    east_two_degrees_median: number;
    south_east_two_degrees_median: number;
    south_two_degrees_median: number;
    south_west_two_degrees_median: number;
    west_two_degrees_median: number;
    north_west_two_degrees_median: number;
    hsd_baseline: number;
    hsd_1_5_degree_above_baseline: number;
    hsd_2_0_degree_above_baseline: number;
    hsd_2_5_degree_above_baseline: number;
    hsd_3_0_degree_above_baseline: number;
    hsd_4_0_degree_above_baseline: number;
    icing_days: number;
};

type BuildingDetailsOutputModel = {
    'UPRN': string;
    'TOID'?: string;
    'FullAddress'?: string;
    'PostCode'?: PostCode;
    'StructureUnitType'?: StructureUnitType;
    'BuiltForm'?: BuiltForm;
    'LodgementDate': string | Date;
    'YearOfAssessment'?: string;
    'EPC'?: EPCRating;
    'SAPPoints'?: string;
    'FloorConstruction'?: string;
    'FloorInsulation'?: string;
    'RoofConstruction'?: string;
    'RoofInsulationLocation'?: string;
    'RoofInsulationThickness'?: string;
    'WallConstruction'?: string;
    'WallInsulation'?: string;
    'WindowGlazing'?: string;
    'FuelType'?: string;
    'RoofMaterial'?: string;
    'RoofShape'?: string;
    'Longitude'?: string;
    'Latitude'?: string;
    'SolarPanels'?: boolean;
    'RoofAspectAreaFacingNorth(m2)'?: string;
    'RoofAspectAreaFacingNorthEast(m2)'?: string;
    'RoofAspectAreaFacingEast(m2)'?: string;
    'RoofAspectAreaFacingSouthEast(m2)'?: string;
    'RoofAspectAreaFacingSouth(m2)'?: string;
    'RoofAspectAreaFacingSouthWest(m2)'?: string;
    'RoofAspectAreaFacingWest(m2)'?: string;
    'RoofAspectAreaFacingNorthWest(m2)'?: string;
    'RoofAspectAreaIndeterminable(m2)'?: string;
    'WindDrivenRainNorthTwoDegreesMedian(mm/year)'?: number;
    'WindDrivenRainNorthEastTwoDegreesMedian(mm/year)'?: number;
    'WindDrivenRainEastTwoDegreesMedian(mm/year)'?: number;
    'WindDrivenRainSouthEastTwoDegreesMedian(mm/year)'?: number;
    'WindDrivenRainSouthTwoDegreesMedian(mm/year)'?: number;
    'WindDrivenRainSouthWestTwoDegreesMedian(mm/year)'?: number;
    'WindDrivenRainWestTwoDegreesMedian(mm/year)'?: number;
    'WindDrivenRainNorthWestTwoDegreesMedian(mm/year)'?: number;
    'WindDrivenRainNorthFourDegreesMedian(mm/year)'?: number;
    'WindDrivenRainNorthEastFourDegreesMedian(mm/year)'?: number;
    'WindDrivenRainEastFourDegreesMedian(mm/year)'?: number;
    'WindDrivenRainSouthEastFourDegreesMedian(mm/year)'?: number;
    'WindDrivenRainSouthFourDegreesMedian(mm/year)'?: number;
    'WindDrivenRainSouthWestFourDegreesMedian(mm/year)'?: number;
    'WindDrivenRainWestFourDegreesMedian(mm/year)'?: number;
    'WindDrivenRainNorthWestFourDegreesMedian(mm/year)'?: number;
    'AnnualCountOfHotSummerDaysBaselineMedian(2001-2020)'?: number;
    'AnnualCountOfHotSummerDaysAboveBaselineMedian(1.5 degrees)'?: number;
    'AnnualCountOfHotSummerDaysAboveBaselineMedian(2 degrees)'?: number;
    'AnnualCountOfHotSummerDaysAboveBaselineMedian(2.5 degrees)'?: number;
    'AnnualCountOfHotSummerDaysAboveBaselineMedian(3 degrees)'?: number;
    'AnnualCountOfHotSummerDaysAboveBaselineMedian(4 degrees)'?: number;
    'AnnualCountOfIcingDays'?: number;
};

@Injectable({ providedIn: 'root' })
export class DataDownloadService {
    readonly #httpClient: HttpClient = inject(HttpClient);

    private readonly warning = `
      Warning: The downloaded data is static and will not refresh after download. We advise using the tool for accessing the most current data available.
      The data you have downloaded represents a point-in-time snapshot and will not reflect real-time updates or changes. It is valid and accurate only at the moment of download.
      Any subsequent updates or modifications made to the original dataset will not be reflected in this downloaded version.
      Please ensure that you verify the currency of the data for your specific needs. We recommend referring back to the online version or consulting the relevant authoritative sources for the most up-to-date information.
  `;

    public downloadXlsxData(buildingsData: BuildingModel[], buildingsWeatherData: BuildingWeatherDataModel[]): void {
        const wsData = this.mapMultipleBuildingProperties(buildingsData, buildingsWeatherData);

        if (wsData.length === 0) {
            throw new Error('Error: No data to download!');
        }

        const ws = utils.json_to_sheet(wsData, {
            cellDates: true,
            header: Object.keys(wsData[0]),
        });

        const warningWS = utils.aoa_to_sheet([[this.warning]]);
        const wb = utils.book_new();
        const filename = this.generateFileName() + '.xlsx';

        utils.book_append_sheet(wb, warningWS, 'WARNING');
        utils.book_append_sheet(wb, ws, 'Data');
        writeFileXLSX(wb, filename);
    }

    public bulkDownloadXlsxData(uprns: string[]): void {
        this.getBuildingDetailsForBulkDownload(uprns).subscribe((data) => {
            if (data.length == 2) {
                this.downloadXlsxData(data[0] as BuildingModel[], data[1] as BuildingWeatherDataModel[]);
            }
        });
    }

    /**
     * Format data into blob url & download by adding a link to the document
     * @param data the data to be downloaded as an object
     * @returns void
     */
    public downloadCSVData(buildingsData: BuildingModel[], buildingsWeatherData: BuildingWeatherDataModel[]): void {
        const data = this.mapMultipleBuildingProperties(buildingsData, buildingsWeatherData);

        if (data.length === 0) {
            throw new Error('Error: No data to download!');
        }

        const csvBlob = this.formatDataForCSV(data);
        this.createZipFile(csvBlob);
    }

    public bulkDownloadCSVData(uprns: string[]): void {
        this.getBuildingDetailsForBulkDownload(uprns).subscribe((data) => {
            if (data.length == 2) {
                this.downloadCSVData(data[0] as BuildingModel[], data[1] as BuildingWeatherDataModel[]);
            }
        });
    }

    private generateFileName(): string {
        return 'iris-download-' + new Date().toISOString().replaceAll(':', '_').replaceAll('.', '_');
    }

    /**
     * Stringify the data, add newlines and convert to blob
     * @param buildings the array of objects to be formatted & blobified
     * @returns a csv compliant blob of the data
     */
    private formatDataForCSV(buildings: BuildingDetailsOutputModel[]): Blob {
        const csvRows = [];
        const headers = Object.keys(buildings[0]);
        csvRows.push(headers.join(','));
        for (const building of buildings) {
            const values = headers.map((header) => {
                // eslint-disable-next-line
                //@ts-ignore
                const val = building[header];
                return `"${val?.toString() || ''}"`;
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

    private mapMultipleBuildingProperties(
        buildingModels: BuildingModel[],
        buildingWeatherDataModels: BuildingWeatherDataModel[],
    ): BuildingDetailsOutputModel[] {
        return buildingModels.map((buildingModel) => {
            const buildingWeatherDataModel = buildingWeatherDataModels.find((data) => data.uprn === buildingModel.UPRN);

            return this.mapSingleBuildingProperties(buildingModel, buildingWeatherDataModel);
        });
    }

    private mapSingleBuildingProperties(buildingModel: BuildingModel, buildingWeatherDataModel?: BuildingWeatherDataModel): BuildingDetailsOutputModel {
        return {
            'UPRN': buildingModel.UPRN,
            'TOID': buildingModel.TOID,
            'FullAddress': buildingModel.FullAddress,
            'PostCode': buildingModel.PostCode,
            'StructureUnitType': buildingModel.StructureUnitType,
            'BuiltForm': buildingModel.BuiltForm,
            'LodgementDate': buildingModel.LodgementDate ? new Date(buildingModel.LodgementDate) : '',
            'YearOfAssessment': buildingModel.YearOfAssessment,
            'EPC': buildingModel.EPC,
            'SAPPoints': buildingModel.SAPPoints,
            'FloorConstruction': buildingModel.FloorConstruction,
            'FloorInsulation': buildingModel.FloorInsulation,
            'RoofConstruction': buildingModel.RoofConstruction,
            'RoofInsulationLocation': buildingModel.RoofInsulationLocation,
            'RoofInsulationThickness': buildingModel.RoofInsulationThickness,
            'WallConstruction': buildingModel.WallConstruction,
            'WallInsulation': buildingModel.WallInsulation,
            'WindowGlazing': buildingModel.WindowGlazing,
            'FuelType': buildingModel.FuelType,
            'RoofMaterial': buildingModel.RoofMaterial,
            'RoofShape': buildingModel.RoofShape,
            'Longitude': buildingModel.longitude,
            'Latitude': buildingModel.latitude,
            'SolarPanels': buildingModel.SolarPanelPresence === 'HasSolarPanels',
            'RoofAspectAreaFacingNorth(m2)': buildingModel.RoofAspectAreaNorth,
            'RoofAspectAreaFacingNorthEast(m2)': buildingModel.RoofAspectAreaNortheast,
            'RoofAspectAreaFacingEast(m2)': buildingModel.RoofAspectAreaEast,
            'RoofAspectAreaFacingSouthEast(m2)': buildingModel.RoofAspectAreaSoutheast,
            'RoofAspectAreaFacingSouth(m2)': buildingModel.RoofAspectAreaSouth,
            'RoofAspectAreaFacingSouthWest(m2)': buildingModel.RoofAspectAreaSouthwest,
            'RoofAspectAreaFacingWest(m2)': buildingModel.RoofAspectAreaWest,
            'RoofAspectAreaFacingNorthWest(m2)': buildingModel.RoofAspectAreaNorthwest,
            'RoofAspectAreaIndeterminable(m2)': buildingModel.RoofAspectAreaIndeterminable,
            'WindDrivenRainNorthTwoDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.northTwoDegreesMedian,
            'WindDrivenRainNorthEastTwoDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.northEastTwoDegreesMedian,
            'WindDrivenRainEastTwoDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.eastTwoDegreesMedian,
            'WindDrivenRainSouthEastTwoDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.southEastTwoDegreesMedian,
            'WindDrivenRainSouthTwoDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.southTwoDegreesMedian,
            'WindDrivenRainSouthWestTwoDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.southWestTwoDegreesMedian,
            'WindDrivenRainWestTwoDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.westTwoDegreesMedian,
            'WindDrivenRainNorthWestTwoDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.northWestTwoDegreesMedian,
            'WindDrivenRainNorthFourDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.northFourDegreesMedian,
            'WindDrivenRainNorthEastFourDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.northEastFourDegreesMedian,
            'WindDrivenRainEastFourDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.eastFourDegreesMedian,
            'WindDrivenRainSouthEastFourDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.southEastFourDegreesMedian,
            'WindDrivenRainSouthFourDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.southFourDegreesMedian,
            'WindDrivenRainSouthWestFourDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.southWestFourDegreesMedian,
            'WindDrivenRainWestFourDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.westFourDegreesMedian,
            'WindDrivenRainNorthWestFourDegreesMedian(mm/year)': buildingWeatherDataModel?.buildingWindDrivenRainDataModel?.northWestFourDegreesMedian,
            'AnnualCountOfHotSummerDaysBaselineMedian(2001-2020)': buildingWeatherDataModel?.buildingHotSummerDaysDataModel?.baselineMedian,
            'AnnualCountOfHotSummerDaysAboveBaselineMedian(1.5 degrees)':
                buildingWeatherDataModel?.buildingHotSummerDaysDataModel?.degreesAboveBaselineMedian.get(1.5),
            'AnnualCountOfHotSummerDaysAboveBaselineMedian(2 degrees)':
                buildingWeatherDataModel?.buildingHotSummerDaysDataModel?.degreesAboveBaselineMedian.get(2),
            'AnnualCountOfHotSummerDaysAboveBaselineMedian(2.5 degrees)':
                buildingWeatherDataModel?.buildingHotSummerDaysDataModel?.degreesAboveBaselineMedian.get(2.5),
            'AnnualCountOfHotSummerDaysAboveBaselineMedian(3 degrees)':
                buildingWeatherDataModel?.buildingHotSummerDaysDataModel?.degreesAboveBaselineMedian.get(3),
            'AnnualCountOfHotSummerDaysAboveBaselineMedian(4 degrees)':
                buildingWeatherDataModel?.buildingHotSummerDaysDataModel?.degreesAboveBaselineMedian.get(4),
            'AnnualCountOfIcingDays': buildingWeatherDataModel?.buildingIcingDaysDataModel?.icingDays,
        };
    }

    private mapBuildingsDetails(buildingsDetails: BuildingDetails[]): BuildingModel[] {
        return buildingsDetails.map((buildingDetails) => ({
            UPRN: buildingDetails.uprn,
            TOID: buildingDetails.toid,
            FullAddress: buildingDetails.first_line_of_address ?? '',
            PostCode: parsePostcode(buildingDetails.post_code ?? '') as PostCode | undefined,
            StructureUnitType: buildingDetails.type as StructureUnitType | undefined,
            BuiltForm: parseBuiltForm(buildingDetails.built_form) as BuiltForm | undefined,
            LodgementDate: buildingDetails.lodgement_date,
            YearOfAssessment: buildingDetails.lodgement_date ? new Date(buildingDetails.lodgement_date).getFullYear().toString() : undefined,
            EPC: parseEPCRating(buildingDetails.energy_rating),
            SAPPoints: buildingDetails.sap_rating,
            FloorConstruction: buildingDetails.floor_construction,
            FloorInsulation: buildingDetails.floor_insulation,
            RoofConstruction: buildingDetails.roof_construction,
            RoofInsulationLocation: buildingDetails.roof_insulation_location,
            RoofInsulationThickness: buildingDetails.roof_insulation_thickness,
            WallConstruction: buildingDetails.wall_construction,
            WallInsulation: buildingDetails.wall_insulation,
            WindowGlazing: buildingDetails.window_glazing,
            longitude: buildingDetails.longitude,
            latitude: buildingDetails.latitude,
            FuelType: buildingDetails.fuel_type,
            RoofMaterial: buildingDetails.roof_material,
            SolarPanelPresence: buildingDetails.solar_panel_presence,
            RoofShape: buildingDetails.roof_shape,
            RoofAspectAreaNorth: buildingDetails.roof_aspect_area_facing_north_m2,
            RoofAspectAreaNorthEast: buildingDetails.roof_aspect_area_facing_north_east_m2,
            RoofAspectAreaEast: buildingDetails.roof_aspect_area_facing_east_m2,
            RoofAspectAreaSouthEast: buildingDetails.roof_aspect_area_facing_south_east_m2,
            RoofAspectAreaSouth: buildingDetails.roof_aspect_area_facing_south_m2,
            RoofAspectAreaSouthWest: buildingDetails.roof_aspect_area_facing_south_west_m2,
            RoofAspectAreaWest: buildingDetails.roof_aspect_area_facing_west_m2,
            RoofAspectAreaNorthWest: buildingDetails.roof_aspect_area_facing_north_west_m2,
        }));
    }

    private mapBuildingsWeatherDetails(buildingsDetails: BuildingDetails[]): BuildingWeatherDataModel[] {
        return buildingsDetails.map((buildingDetails) => ({
            uprn: buildingDetails.uprn,
            buildingWindDrivenRainDataModel: {
                northTwoDegreesMedian: buildingDetails.north_two_degrees_median,
                northEastTwoDegreesMedian: buildingDetails.north_east_two_degrees_median,
                eastTwoDegreesMedian: buildingDetails.east_two_degrees_median,
                southEastTwoDegreesMedian: buildingDetails.south_east_two_degrees_median,
                southTwoDegreesMedian: buildingDetails.south_two_degrees_median,
                southWestTwoDegreesMedian: buildingDetails.south_west_two_degrees_median,
                westTwoDegreesMedian: buildingDetails.west_two_degrees_median,
                northWestTwoDegreesMedian: buildingDetails.north_west_two_degrees_median,
                northFourDegreesMedian: buildingDetails.north_four_degrees_median,
                northEastFourDegreesMedian: buildingDetails.north_east_four_degrees_median,
                eastFourDegreesMedian: buildingDetails.east_four_degrees_median,
                southEastFourDegreesMedian: buildingDetails.south_east_four_degrees_median,
                southFourDegreesMedian: buildingDetails.south_four_degrees_median,
                southWestFourDegreesMedian: buildingDetails.south_west_four_degrees_median,
                westFourDegreesMedian: buildingDetails.west_four_degrees_median,
                northWestFourDegreesMedian: buildingDetails.north_west_four_degrees_median,
            },
            buildingHotSummerDaysDataModel: {
                baselineMedian: buildingDetails.hsd_baseline,
                degreesAboveBaselineMedian: new Map([
                    [1.5, buildingDetails.hsd_1_5_degree_above_baseline],
                    [2, buildingDetails.hsd_2_0_degree_above_baseline],
                    [2.5, buildingDetails.hsd_2_5_degree_above_baseline],
                    [3, buildingDetails.hsd_3_0_degree_above_baseline],
                    [4, buildingDetails.hsd_4_0_degree_above_baseline],
                ]),
            },
            buildingIcingDaysDataModel: {
                icingDays: buildingDetails.icing_days,
            },
            buildingSunlightHoursDataModel: {
                sunlightHours: 0,
                dailySunlightHours: 0,
            },
        }));
    }

    private getBuildingDetailsForBulkDownload(uprns: string[]): Observable<(BuildingModel[] | BuildingWeatherDataModel[])[]> {
        const paramString = uprns.map((uprn) => `uprns=${uprn}`).join('&');
        return this.#httpClient.get<BuildingDetails[]>(`/api/data/buildings/download?${paramString}`, { withCredentials: true }).pipe(
            map((buildingsDetails) => [this.mapBuildingsDetails(buildingsDetails), this.mapBuildingsWeatherDetails(buildingsDetails)]),
            catchError((error) => {
                console.error(`Error: Unable to fetch buildings details for the provided uprns: ${JSON.stringify(error)}`);
                return of([]);
            }),
        );
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
