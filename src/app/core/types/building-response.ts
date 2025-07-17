import { BuiltForm, EPCRating, PostCode, StructureUnitType } from '@core/enums';

export type EPCBuildingResponseModel = {
    BuiltForm: BuiltForm;
    EPC: EPCRating;
    FullAddress: string;
    LodgementDate: string;
    InsulationTypes: string;
    InsulationThickness: string;
    InsulationThicknessLowerBound: string;
    ParentTOID?: string;
    PartTypes: string;
    PostCode: PostCode;
    StructureUnitType: StructureUnitType;
    UPRN: string;
    TOID?: string;
};

export type NoEPCBuildingResponseModel = Omit<
    EPCBuildingResponseModel,
    'BuiltForm' | 'EPC' | 'LodgementDate' | 'InsulationTypes' | 'InsulationThickness' | 'InsulationThicknessLowerBound' | 'PartTypes' | 'StructureUnitType'
> & {
    latitude: string;
    longitude: string;
};

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
