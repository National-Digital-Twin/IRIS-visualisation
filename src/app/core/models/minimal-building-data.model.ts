import { EPCRating } from '@core/enums';

export interface MinimalBuildingData {
    UPRN: string;
    EPC: EPCRating;
    fullAddress?: string;
    latitude?: number;
    longitude?: number;
    addressText?: string;
    TOID?: string;
    ParentTOID?: string;
    StructureUnitType?: string;
}

export interface MinimalBuildingMap {
    [toid: string]: MinimalBuildingData[];
}
