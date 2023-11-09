interface Map {
  style: string;
  zoom: number;
  pitch: number;
  lng: number;
  lat: number;
}

export interface RuntimeConfigurationModel {
  /* Application is in production */
  production: boolean;
  /* Appliation environment */
  env: 'local' | 'dev' | 'prod';
  /* IA API URL */
  apiURL: string;
  /* Mapbox map config */
  map: Map;
}
