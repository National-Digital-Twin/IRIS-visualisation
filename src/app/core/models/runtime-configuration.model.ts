import { MapConfigModel } from './map-configuration.model';

export interface RuntimeConfigurationModel {
  /* Application is in production */
  production: boolean;
  /* Appliation environment */
  env: 'local' | 'dev' | 'prod';
  /* IA API URL */
  apiURL: string;
  /* Mapbox map config */
  map: MapConfigModel;
}
