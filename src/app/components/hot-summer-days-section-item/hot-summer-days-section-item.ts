import { Component, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MoreInfoSectionItem } from '@components/more-info-section-item/more-info-section-item';
import { BuildingHotSummerDaysDataModel } from '@core/models/building.weather.data.model';

@Component({
    selector: 'c477-hot-summer-days-section-item',
    imports: [MoreInfoSectionItem],
    templateUrl: './hot-summer-days-section-item.html',
    styleUrl: './hot-summer-days-section-item.scss',
})
export class HotSummerDaysSectionItem {
    readonly #sanitizer = inject(DomSanitizer);

    public readonly warningGuidance = `
        <p>
            <strong>This property is located in an area that experiences elevated summer temperatures.</strong>
        </p>
        <p>
            Higher peak temperatures increase the risk of overheating, particularly in well-insulated and more airtight dwellings. Retrofit measures,
            including insulation upgrades, glazing changes and airtightness improvements, should be designed alongside ventilation, shading and solar gain
            controls to maintain safe and comfortable indoor temperatures.
        </p>
        <p>
            This flag reflects area-level climate exposure, not confirmed overheating at this property. A whole-dwelling assessment should consider summer
            performance as well as energy efficiency.
        </p>
    `;

    public readonly downloadableWarningGuidanceMoreInfo = {
        content: this.#sanitizer.bypassSecurityTrustHtml(`
            <h2 style="font-weight: 550;">Hot summer days and retrofit risk in UK housing</h2>
            <div style="display: flex; justify-content: center; padding: 30px;">
                <p><em>More information coming soon</em></p>
            </div>
        `),
    };

    public dataInput = input.required<BuildingHotSummerDaysDataModel>();
    public warnInput = input.required<boolean>();
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
