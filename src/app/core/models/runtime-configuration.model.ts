import { URLStateModel } from '@core/models/url-state.model';
import { MapLayerFilter } from '@core/models/layer-filter.model';
import { MapLayerId } from '@core/types/map-layer-id';
import { Theme } from '@core/types/theme';

import { Layer as MapboxLayer } from 'mapbox-gl';

type Layer = MapboxLayer & { filter: MapLayerFilter & { layerId: MapLayerId } };

export interface RuntimeConfigurationModel {
  /* Application is in production */
  production: boolean;
  /* Appliation environment */
  env: 'local' | 'dev' | 'prod';
  /* IA API URL */
  apiURL: string;
  /* OS PLACES API URL */
  placesAPIURL: string;
  /* Mapbox map config */
  map: URLStateModel & { style: Record<Theme, string> };
  /* Mapbox map layers */
  mapLayers: Layer[];
  /** EPC Colours */
  epcColours: { [key: string]: string };
  /** EPC Colours - Colour Deficient*/
  epcColoursCD: { [key: string]: string };
  /* Company logo */
  companyLogo: Record<Theme, string>;
}
