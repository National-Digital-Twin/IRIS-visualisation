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
        pdfFilename: 'hot-summer-days-more-info.pdf',
        content: this.#sanitizer.bypassSecurityTrustHtml(`
            <div>
                <h2 style="font-weight: 550;">What are “hot summer days”?</h2>
                <p>
                    “Hot summer days” refer to days where outdoor temperatures exceed defined high-temperature thresholds, based on Met Office climate datasets and projections. These conditions increase the likelihood of:
                </p>
                <ul>
                    <li>Indoor overheating</li>
                    <li>Thermal discomfort and sleep disturbance</li>
                    <li>Elevated health risk for vulnerable occupants</li>
                    <li>Increased cooling demand</li>
                </ul>
                <p>
                    Across the UK, hot summer days are more frequent in southern and eastern regions. On the IRIS map, areas with higher frequency appear in darker shading, indicating greater exposure to elevated temperatures. Northern and western regions generally experience fewer very hot days, though extreme events can occur anywhere.
                </p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h2 style="font-weight: 550;">Data source and accuracy</h2>
                <p>The hot summer day data used in this tool is derived from <strong>Met Office climate datasets and projections</strong>.</p>
                <p>It is important to note:</p>
                <ul>
                    <li>The data is provided at <strong>area-level grid resolution</strong>, not at individual property scale.</li>
                    <li>It reflects broad climatic patterns across relatively large geographic squares.</li>
                    <li>
                        Local factors such as urban density, shading, proximity to water, altitude and orientation can cause significant variation within a grid square.
                    </li>
                </ul>
                <p>
                    If a property falls within a higher-frequency hot day zone, this does <strong>not</strong> mean the dwelling will necessarily overheat. It indicates that the wider area experiences more frequent high-temperature conditions.
                </p>
                <p>The indicator therefore highlights potential exposure and supports additional assessment where appropriate.</p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h2 style="font-weight: 550;">Why hot summer days matter for retrofit</h2>
                <p>
                    Improving energy efficiency can unintentionally increase overheating risk if summer performance is not considered alongside winter heat loss reduction.
                </p>
                <h3 style="font-weight: 500;">1. Insulation and airtightness</h3>
                <p>Fabric upgrades such as loft insulation, wall insulation and airtightness improvements can:</p>
                <ul>
                    <li>Reduce heat loss in winter</li>
                    <li>Limit heat dissipation in summer</li>
                    <li>Increase risk of elevated indoor temperatures if ventilation and shading are not addressed</li>
                </ul>
                <p>Overheating risk is particularly relevant in well-insulated dwellings with limited cross-ventilation.</p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h3 style="font-weight: 500;">2. Glazing and solar gain</h3>
                <p>Solar radiation entering through windows is a major contributor to overheating.</p>
                <p>In higher-exposure areas:</p>
                <ul>
                    <li>Large south- and west-facing glazing can increase internal heat gains</li>
                    <li>Upgraded glazing without shading provision may not reduce peak summer temperatures</li>
                    <li>Solar control measures (e.g. external shading, appropriate glazing specification) may be beneficial</li>
                </ul>
                <p>Design decisions should consider both winter heat retention and summer solar gain.</p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h3 style="font-weight: 500;">3. Urban heat island effects</h3>
                <p>In denser urban areas:</p>
                <ul>
                    <li>Night-time cooling may be reduced</li>
                    <li>Stored heat in surrounding surfaces can increase background temperatures</li>
                </ul>
                <p>This can amplify overheating risk even where regional climate data appears moderate.</p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h3 style="font-weight: 500;">4. Ventilation strategy</h3>
                <p>Effective ventilation is central to managing overheating risk.</p>
                <p>Retrofit design should consider:</p>
                <ul>
                    <li>Purge ventilation capability</li>
                    <li>Cross-ventilation opportunities</li>
                    <li>Mechanical ventilation strategy</li>
                    <li>Occupant usability</li>
                </ul>
                <p>Under a whole-dwelling retrofit approach, ventilation must be considered alongside airtightness improvements.</p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h2 style="font-weight: 550;">What this visual layer means in IRIS</h2>
                <p>If this property is flagged for hot summer days:</p>
                <ul>
                    <li>It is located in an area where elevated summer temperatures occur relatively frequently.</li>
                    <li>Darker shading on the map indicates higher average exposure to hot conditions.</li>
                    <li>The data reflects area-level climate modelling, not an assessment of the building’s current thermal performance.</li>
                </ul>
                <p>This indicator does <strong>not</strong> confirm that the dwelling overheats or that retrofit measures are unsuitable.</p>
                <p>
                    It signals that summer performance should be considered when planning insulation, glazing and airtightness improvements, particularly under a PAS 2035 whole-dwelling approach.
                <p>
            </div>
        `),
    };

    public dataInput = input.required<BuildingHotSummerDaysDataModel>();
    public warnInput = input.required<boolean>();
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
