import { Component, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MoreInfoSectionItem } from '@components/more-info-section-item/more-info-section-item';
import { BuildingIcingDaysDataModel } from '@core/models/building.weather.data.model';

@Component({
    selector: 'c477-icing-days-section-item',
    imports: [MoreInfoSectionItem],
    templateUrl: './icing-days-section-item.html',
    styleUrl: './icing-days-section-item.scss',
})
export class IcingDaysSectionItem {
    readonly #sanitizer = inject(DomSanitizer);

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

    public readonly downloadableWarningGuidanceMoreInfo = {
        pdfFilename: 'icing-days-more-info.pdf',
        content: this.#sanitizer.bypassSecurityTrustHtml(`
            <div>
                <h2 style="font-weight: 550;">What are “icing days”?</h2>
                <p>
                    “Icing days” typically refer to days where the <strong>maximum outdoor air temperature does not rise above 0°C</strong>. These conditions increase the likelihood of:
                </p>
                <ul>
                    <li>Freeze–thaw cycling in building materials</li>
                    <li>Ice formation in drainage and rainwater systems</li>
                    <li>Increased heating demand</li>
                    <li>Elevated risk of surface condensation where ventilation is inadequate</li>
                </ul>
                <p>
                    Across the UK, icing days are more frequent in northern regions and particularly in <strong>upland and mountainous areas</strong>. On the IRIS map, these locations often appear in darker blue shading, reflecting a higher average number of freezing days. Lower-lying and southern areas generally experience fewer icing days.
                </p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h2 style="font-weight: 550;">Data source and accuracy</h2>
                <p>The icing day data used in this tool is derived from <strong>Met Office climate datasets and projections</strong>.</p>
                <p>It is important to note:</p>
                <ul>
                    <li>The data is provided at <strong>area-level grid resolution</strong>, rather than being specific to an individual property.</li>
                    <li>It reflects broad climatic patterns across relatively large geographic squares.</li>
                    <li>Local factors such as altitude, shelter, urban heat island effects and topography can result in variation within a grid square.</li>
                </ul>
                <p>
                    If a property falls within a darker blue (higher-frequency) icing zone, this does **not** mean the specific dwelling will certainly experience severe freezing stress. It indicates that freezing conditions are more common in that wider area.
                </p>
                <p>The indicator is therefore a prompt for <strong>additional design consideration</strong>, not confirmation of defect.</p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h2 style="font-weight: 550;">Why Icing Days matter for retrofit</h2>
                <p>Freezing conditions influence both building durability and retrofit performance.</p>
                <h3 style="font-weight: 500;">1. Freeze–thaw stress in masonry</h3>
                <p>Repeated freezing and thawing can:</p>
                <ul>
                    <li>Cause cracking or spalling in brick, stone and render</li>
                    <li>Exacerbate defects in mortar joints or pointing</li>
                    <li>Increase long-term façade maintenance requirements</li>
                </ul>
                <p>
                    Retrofit systems fixed to external walls (such as external wall insulation) should be specified with appropriate freeze–thaw durability where exposure is higher.
                </p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h3 style="font-weight: 500;">2. Roofs, gutters and drainage</h3>
                <p>Frequent icing conditions can:</p>
                <ul>
                    <li>Lead to ice build-up in gutters and downpipes</li>
                    <li>Stress rainwater goods and joints</li>
                    <li>Increase the risk of water backing up behind insulation layers</li>
                </ul>
                <p>Roof insulation upgrades and eaves detailing should therefore consider drainage performance in colder conditions.</p>
                <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
                <h3 style="font-weight: 500;">3. Ventilation and moisture risk</h3>
                <p>In colder climates:</p>
                <ul>
                    <li>Occupants may reduce ventilation during winter, increasing internal humidity.</li>
                    <li>Airtightness improvements without appropriate ventilation provision may elevate condensation risk.</li>
                    <li>Cold internal surfaces are more susceptible to surface mould growth.</li>
                </ul>
                <p>Under a PAS 2035 approach, retrofit design should assess ventilation, heating strategy and moisture risk alongside fabric upgrades.</p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h3 style="font-weight: 500;">4. External insulation and finishes</h3>
                <p>External insulation systems and façade treatments in higher icing zones should:</p>
                <ul>
                    <li>Be suitable for freeze–thaw exposure</li>
                    <li>Maintain robust detailing at sills, eaves and penetrations</li>
                    <li>Use materials and finishes rated for the relevant exposure conditions</li>
                </ul>
                <p>Correct specification helps ensure durability under repeated freezing cycles.</p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h2 style="font-weight: 550;">What this visual layer means in IRIS</h2>
                <p>If this property is flagged for icing days:</p>
                <ul>
                    <li>It is located in an area where freezing conditions occur relatively frequently.</li>
                    <li>Darker blue shading on the map indicates higher average icing day frequency.</li>
                    <li>The data reflects area-level climate modelling, not a property survey.</li>
                </ul>
                <p>This indicator does <strong>not</strong> mean the dwelling has existing defects or that retrofit is unsuitable.</p>
                <p>
                    It signals that freezing exposure is a relevant environmental factor that should be considered when planning and specifying retrofit measures.
                </p>
            </div>
        `),
    };

    public dataInput = input.required<BuildingIcingDaysDataModel>();
    public warnInput = input.required<boolean>();
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
