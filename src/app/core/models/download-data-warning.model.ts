import { BuildingModel } from './building.model';

export type DownloadDataWarningData = {
  addresses: string[];
  addressCount: number | undefined;
};
export type DownloadDataWarningResponse = 'xlsx' | 'csv';

export interface DownloadBuilding {
  building: BuildingModel;
  format: DownloadDataWarningResponse;
}
