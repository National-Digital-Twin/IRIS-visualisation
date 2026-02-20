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
            <strong>This property is located in an area that experiences frequent freezing conditions.</strong>
        </p>
        <p>
            Repeated freeze–thaw cycles can increase stress on masonry, render, roofing elements, rainwater goods and external finishes. In colder climates,
            retrofit measures, particularly external wall insulation, roof upgrades, ventilation changes and drainage alterations, should be specified to
            withstand freeze–thaw exposure and maintain adequate moisture management.
        </p>
        <p>
            This flag reflects area-level climate conditions, not confirmed defects at this property. Additional assessment may be appropriate before installation.
        </p>
    `;

    public dataInput = input.required<BuildingIcingDaysDataModel>();
    public warnInput = input.required<boolean>();
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
