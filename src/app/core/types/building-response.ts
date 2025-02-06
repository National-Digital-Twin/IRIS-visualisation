import { BuildForm, EPCRating, PostCode, PropertyType } from '@core/enums';

export type EPCBuildingResponseModel = {
    BuildForm: BuildForm;
    EPC: EPCRating;
    FullAddress: string;
    InspectionDate: string;
    InsulationTypes: string;
    InsulationThickness: string;
    InsulationThicknessLowerBound: string;
    ParentTOID?: string;
    PartTypes: string;
    PostCode: PostCode;
    PropertyType: PropertyType;
    UPRN: string;
    TOID?: string;
};

export type NoEPCBuildingResponseModel = Omit<
    EPCBuildingResponseModel,
    'BuildForm' | 'EPC' | 'InspectionDate' | 'InsulationTypes' | 'InsulationThickness' | 'InsulationThicknessLowerBound' | 'PartTypes' | 'PropertyType'
> & {
    latitude: string;
    longitude: string;
};
