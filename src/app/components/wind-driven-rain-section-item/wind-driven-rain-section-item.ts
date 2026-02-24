import { Component, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MoreInfoSectionItem } from '@components/more-info-section-item/more-info-section-item';
import { BuildingWindDrivenRainDataModel } from '@core/models/building.weather.data.model';

@Component({
    selector: 'c477-wind-driven-rain-section-item',
    imports: [MoreInfoSectionItem],
    templateUrl: './wind-driven-rain-section-item.html',
    styleUrl: './wind-driven-rain-section-item.scss',
})
export class WindDrivenRainSectionItem {
    readonly #sanitizer = inject(DomSanitizer);

    public readonly warningGuidance = `
        <p>
            <strong>This property is within an area with elevated wind-driven rain exposure under current and projected climate conditions.</strong>
        </p>
        <p>
            Wind-driven rain increases moisture loading on exposed walls and roofs. In higher-exposure areas, some retrofit measures — particularly cavity wall
            insulation, internal wall insulation, external wall insulation and airtightness improvements — may require enhanced moisture risk assessment and
            detailing to avoid unintended damp or condensation risks.
        </p>
        <p>
            This flag reflects area-level climate exposure, not confirmed defects at this property.
        </p>
        <p>
            A <a href="https://www.bsigroup.com/en-GB/insights-and-media/insights/brochures/pas-2035-retrofitting-dwellings-for-improved-energy-efficiency/" target="_blank">PAS 2035</a> - compliant assessment should consider local exposure and wall construction before installation.
        </p>
    `;

    public readonly downloadableWarningGuidanceMoreInfo = {
        pdfFilepath: '../../../assets',
        pdfFilename: 'wind-driven-rain-more-info.pdf',
        content: this.#sanitizer.bypassSecurityTrustHtml(`
            <div>
                <h2 style="font-weight: 550;">Why wind-driven rain matters</h2>
                <p>
                    Wind-driven rain (WDR) refers to rain carried by wind onto vertical building surfaces. Unlike rainfall measured horizontally, WDR increases
                    moisture exposure on façades, particularly gable ends, exposed elevations and buildings in coastal or upland locations.
                </p>
                <p>
                    Across the UK, exposure varies significantly by geography. Western, coastal and upland areas typically experience the highest levels of
                    wind-driven rain. Climate projections indicate that winter rainfall intensity is likely to increase under future warming scenarios, which
                    may increase façade moisture loading in some regions.
                </p>
                <p>
                    In retrofit contexts, including delivery under ECO4 and PAS 2035, elevated WDR exposure is a recognised risk factor for moisture-related
                    defects if measures are not appropriately specified and detailed.
                </p>
            <div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h2 style="font-weight: 550;">Interaction with retrofit measures</h2>
                <div style="margin-top: 10px;">
                    <h3 style="font-weight: 500;">1. Cavity wall insulation (CWI)</h3>
                    <p>CWI can reduce heat loss but alters the moisture balance of the wall system.</p>
                    <p>In areas of high wind-driven rain exposure:</p>
                    <ul>
                        <li>Increased rain penetration risk may overwhelm cavity drainage capacity.</li>
                        <li>Saturation of insulation materials can reduce thermal performance.</li>
                        <li>In certain wall types (e.g. narrow cavities, rubble-filled cavities, poorly tied cavities), moisture bridging risk increases.</li>
                    </ul>
                    <p>
                        Historic failures in exposed areas led to tighter guidance on exposure zones and installation quality. PAS 2035 now requires formal moisture
                        risk assessment prior to installation.
                    </p>
                </div>
                <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
                <div>
                    <h3 style="font-weight: 500;">2. External wall insulation (EWI)</h3>
                    <p>EWI changes the hygrothermal profile of the wall and introduces new junctions and penetrations.</p>
                    <p>Risks in high WDR zones include:</p>
                    <ul>
                        <li>Increased reliance on robust detailing at sills, eaves and parapets.</li>
                        <li>Water ingress at poorly detailed interfaces.</li>
                        <li>Increased risk where render systems are not appropriate for exposure category.</li>
                    </ul>
                    <p>Correct specification of render type, fixings and exposure rating is critical.</p>
                </div>
                <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
                <div>
                    <h3 style="font-weight: 500;">3. Internal wall insulation (IWI)</h3>
                    <p>IWI can reduce internal heat loss but makes the original wall colder and potentially wetter.</p>
                    <p>In exposed areas:</p>
                    <ul>
                        <li>Higher external moisture loads can increase interstitial condensation risk.</li>
                        <li>Freeze–thaw cycling risk may increase in masonry walls.</li>
                        <li>Solid wall properties are particularly sensitive without appropriate vapour control and hygrothermal assessment.</li>
                    </ul>
                    <p>Dynamic moisture modelling (e.g. WUFI-type analysis) is often recommended in higher-risk scenarios.</p>
                </div>
                <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
                <div>
                    <h3 style="font-weight: 500;">4. Airtightness improvements</h3>
                    <p>Increased airtightness without appropriate ventilation can:</p>
                    <ul>
                        <li>Raise internal humidity.</li>
                        <li>Reduce drying potential of walls.</li>
                        <li>Increase mould risk if moisture pathways are not understood.</li>
                    </ul>
                    <p>PAS 2035 requires a whole-dwelling approach that considers ventilation strategy alongside fabric upgrades.</p>
                </div>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h2 style="font-weight: 550;">Why IRIS flags wind-driven rain</h2>
                <p>This tool overlays:</p>
                <ul>
                    <li>Household EPC data (fabric type, insulation status, construction assumptions)</li>
                    <li>Area-level wind-driven rain exposure data (derived from Met Office datasets and climate projections)</li>
                </ul>
                <p>The presence of a warning does <strong>not</strong> indicate that the specific property has moisture defects.
                <p>It indicates that the property is located within a higher-exposure climatic zone where retrofit design should include:<p>
                <ul>
                    <li>Moisture risk assessment</li>
                    <li>Consideration of wall construction and exposure category</li>
                    <li>Appropriate detailing and ventilation strategy</li>
                    <li>Compliance with PAS 2035 retrofit risk assessment procedures</li>
                </ul>
                <p><strong>The flag is a prompt for enhanced due diligence, not a constraint on retrofit.</strong></p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h2 style="font-weight: 550;">Policy and standards context</h2>
                <div style="margin-top: 10px;">
                    <h3 style="font-weight: 500;">PAS 2035: Retrofitting Dwellings for improved Energy Efficiency</h3>
                    <p>Requires:</p>
                    <ul>
                        <li>Assessment of moisture risk</li>
                        <li>Consideration of exposure and location</li>
                        <li>Whole-house retrofit planning</li>
                        <li>Appropriate risk pathway selection</li>
                    </ul>
                </div>
                <div>
                    <h3>ECO4</h3>
                    <p>Delivery must comply with PAS 2035 and associated technical standards, meaning climate exposure is a legitimate design consideration.</p>
                </div>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h2 style="font-weight: 550;">Key UK guidance and research</h2>
                <div style="margin-top: 10px;">
                    <h3 style="font-weight: 500;"><a href="https://www.ukcmb.org/">UK Centre for Moisture in Buildings (UKCMB)</a><h3>
                    <p>Research on moisture risk, retrofit and building pathology.</p>
                    <h3><a href="https://www.metoffice.gov.uk/">Met Office</a></h3>
                    <p>UK climate projections and rainfall intensity datasets.</p>
                    <h3><a href=""https://www.bsigroup.com/>British Standards Institution</a></h3>
                    <p>BS EN ISO 15927-3: Calculation of wind-driven rain index.</p>
                </div>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h2 style="font-weight: 550;">Summary<h2>
                <p>
                    Wind-driven rain is a material design factor in UK retrofit. In higher-exposure areas, certain insulation and airtightness measures require additional assessment to avoid unintended damp or condensation risks.
                </p>
                <p>Area-level climate exposure does not determine outcome, but it informs appropriate design controls.</p>
                <p>A PAS 2035-compliant process ensures that retrofit measures are suitable for both the building and its environmental context.</p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0;">
        `),
    };

    public dataInput = input.required<BuildingWindDrivenRainDataModel>();
    public warnInput = input.required<boolean>();
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
