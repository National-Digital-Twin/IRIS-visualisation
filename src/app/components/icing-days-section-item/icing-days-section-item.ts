import { Component, input } from '@angular/core';
import { MoreInfoSectionItem } from '@components/more-info-section-item/more-info-section-item';
import { BuildingIcingDaysDataModel } from '@core/models/building.weather.data.model';

@Component({
    selector: 'c477-icing-days-section-item',
    imports: [MoreInfoSectionItem],
    templateUrl: './icing-days-section-item.html',
    styleUrl: './icing-days-section-item.scss',
})
export class IcingDaysSectionItem {
    public readonly warningGuidance = `
        <p>
            <strong>This property is in an area that experiences frequent icing or freezing conditions.</strong>
            These conditions can increase stress on building materials, roofs, drainage and ventilation systems.
        </p>
        <p>
            Some retrofit measures, particularly external insulation or ventilation upgrades, may not perform effectively without appropriate design.
            Additional checks are recommended before installation.
        </p>
    `;

    public dataInput = input.required<BuildingIcingDaysDataModel>();
    public warnInput = input.required<boolean>();
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
