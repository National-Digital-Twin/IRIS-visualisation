import { CdkAccordionModule } from '@angular/cdk/accordion';
import { Component, Input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { GuidanceSectionItem } from '@components/guidance-section-item/guidance-section-item';
import { HotSummerDaysSectionItem } from '@components/hot-summer-days-section-item/hot-summer-days-section-item';
import { HoursOfSunlightSectionItem } from '@components/hours-of-sunlight-section-item/hours-of-sunlight-section-item';
import { IcingDaysSectionItem } from '@components/icing-days-section-item/icing-days-section-item';
import { WindDrivenRainSectionItem } from '@components/wind-driven-rain-section-item/wind-driven-rain-section-item';
import { BuildingHotSummerDaysData, BuildingIcingDaysData, BuildingWindDrivenRainData } from '@core/services/climate-data.service';

@Component({
    selector: 'c477-more-info-section',
    imports: [
        MatDividerModule,
        CdkAccordionModule,
        WindDrivenRainSectionItem,
        IcingDaysSectionItem,
        HotSummerDaysSectionItem,
        HoursOfSunlightSectionItem,
        GuidanceSectionItem,
    ],
    templateUrl: './more-info-section.html',
    styleUrl: './more-info-section.scss',
})
export class MoreInfoSection {
    @Input() public buildingWindDrivenRainData: BuildingWindDrivenRainData | null = null;
    @Input() public warnForWindDrivenRain: boolean = false;
    @Input() public buildingIcingDaysData: BuildingIcingDaysData | null = null;
    @Input() public warnForIcingDays: boolean = false;
    @Input() public buildingHotSummerDaysData: BuildingHotSummerDaysData | null = null;
    @Input() public warnForHotSummerDays: boolean = false;
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
