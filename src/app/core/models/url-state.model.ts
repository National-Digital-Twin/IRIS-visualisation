export interface URLStateModel {
  bearing: number;
  center: [number, number];
  pitch: number;
  style?: string;
  zoom: number;
  filter?: string;
}
