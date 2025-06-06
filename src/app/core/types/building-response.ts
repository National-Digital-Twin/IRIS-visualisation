import { BuildForm, EPCRating, FuelType, PostCode, PropertyType } from '@core/enums';

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
    FuelType?: FuelType;
};

export type NoEPCBuildingResponseModel = Omit<
    EPCBuildingResponseModel,
    | 'BuildForm'
    | 'EPC'
    | 'InspectionDate'
    | 'InsulationTypes'
    | 'InsulationThickness'
    | 'InsulationThicknessLowerBound'
    | 'PartTypes'
    | 'PropertyType'
    | 'FuelType'
> & {
    latitude: string;
    longitude: string;
};

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
