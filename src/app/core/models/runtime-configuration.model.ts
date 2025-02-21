import { MapLayerFilter } from '@core/models/layer-filter.model';
import { URLStateModel } from '@core/models/url-state.model';
import { MapLayerId } from '@core/types/map-layer-id';
import { Theme } from '@core/types/theme';
import { AnyLayer } from 'mapbox-gl';
import { MapLayerConfig } from './map-layer-config.model';

type Layer = AnyLayer & { filter: MapLayerFilter & { layerId: MapLayerId } };

export interface RuntimeConfigurationModel {
    /* Application is in production */
    production: boolean;
    /* Appliation environment */
    env: 'local' | 'dev' | 'prod';
    /* IA API URL */
    apiURL: string;
    /** Address search configuration */
    addressSearch: {
        /* OS PLACES API URL */
        placesAPIURL: string;
        /* OS NAMES API URL */
        namesAPIURL: string;
        /**
         * Unique ID of the Local Land & Property Gazetteer custodian.
         * Used to refine search to a specific area
         */
        localCustodianCode: number;
        maxResults: number;
    };
    cache: {
        epc: string;
        sap: string;
        nonEpc: string;
    };
    /* Mapbox minimap config */
    minimap: {
        zoom: number;
    };
    /* Mapbox map config */
    map: URLStateModel & { style: Record<Theme, string> };
    /* Mapbox map layers */
    mapLayers: Layer[];
    /** EPC Colours */
    epcColours: { [key: string]: string };
    /** EPC Colours - Colour Deficient*/
    epcColoursCD: { [key: string]: string };
    /* Map context layers */
    contextLayers: MapLayerConfig[];
}
