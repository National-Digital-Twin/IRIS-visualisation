import { URLStateModel } from './url-state.model';
import { Layer } from 'mapbox-gl';

export interface MapConfig {
  style: string;
  zoom: number;
  pitch: number;
  center: number[];
  bearing: number;
}

export interface RuntimeConfigurationModel {
  /* Application is in production */
  production: boolean;
  /* Appliation environment */
  env: 'local' | 'dev' | 'prod';
  /* IA API URL */
  apiURL: string;
  /* Mapbox map config */
  map: URLStateModel;
  /* Mapbox map layers */
  mapLayers: Layer[];
  /** EPC Colours */
  epcColours: { [key: string]: string };
  /** EPC Colours - Colour Deficient*/
  epcColoursCD: { [key: string]: string };
}
