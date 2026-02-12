import { Component, Input } from '@angular/core';
import { MoreInfoSectionItem } from '@components/more-info-section-item/more-info-section-item';
import { BuildingIcingDaysDataModel } from '@core/models/building.weather.data.model';

@Component({
    selector: 'c477-icing-days-section-item',
    imports: [MoreInfoSectionItem],
    templateUrl: './icing-days-section-item.html',
    styleUrl: './icing-days-section-item.scss',
})
export class IcingDaysSectionItem {
    @Input() public data?: BuildingIcingDaysDataModel;
    @Input() public warn: boolean = false;
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
