import { Component, inject, input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { DownloadableContentModal } from '@components/downloadable-content-modal/downloadable-content-modal';
import { MoreInfoSectionItem } from '@components/more-info-section-item/more-info-section-item';
import { BuildingSunlightHoursDataModel } from '@core/models/building.weather.data.model';

@Component({
    selector: 'c477-hours-of-sunlight-section-item',
    imports: [MoreInfoSectionItem],
    templateUrl: './hours-of-sunlight-section-item.html',
    styleUrl: './hours-of-sunlight-section-item.scss',
})
export class HoursOfSunlightSectionItem {
    readonly #sanitizer = inject(DomSanitizer);
    readonly #dialog = inject(MatDialog);

    public dataInput = input.required<BuildingSunlightHoursDataModel>();

    public readonly downloadableWarningGuidanceMoreInfo = {
        pdfFilename: 'sunlight-hours-more-info.pdf',
        content: this.#sanitizer.bypassSecurityTrustHtml(`
            <div>
                <h2 style="font-weight: 550;">What does “hours of sunlight” mean?</h2>
                <p>This indicator reflects the average number of annual sunshine hours in the local area, based on Met Office climate data.
                <p>
                    It provides an estimate of the <strong>solar resource available at area level</strong>, which can influence the potential performance of solar technologies such as:
                </p>
                <ul>
                    <li>Solar photovoltaic (PV) panels</li>
                    <li>Solar thermal systems</li>
                </ul>
                <p>
                    Across the UK, southern regions generally receive more annual sunshine hours than northern regions. However, regional variation is gradual rather than absolute, and viable solar installations are present throughout the country.
                </p>
                <p>This panel is <strong>informational<strong> and does not indicate risk or defect.</p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h2 style="font-weight: 550;">Data Source and Accuracy</h2>
                <p>The hours of sunlight data used in IRIS is derived from Met Office climate datasets.</p>
                <p>
                    IRIS uses <strong>recent multi-year observational data (approximately the last five years)</strong> rather than long-term historical averages. This reflects current climatic conditions and recent trends, which are particularly relevant when considering near-term solar performance.
                </p>
                <p>The data:</p>
                <ul>
                    <li>Is provided at <strong>area-level grid scale</strong>, not individual property scale.</li>
                    <li>Represents average sunshine hours across relatively large geographic squares.</li>
                    <li>Does not account for site-specific factors such as roof orientation, pitch, shading or surrounding buildings.</li>
                    <li>Reflects recent conditions and may vary over time as climate patterns continue to change.</li>
                </ul>
                <p>
                    If a property is located within a higher sunshine area, this indicates stronger recent average solar resource in that location. It does not confirm technical feasibility or guaranteed generation at property level.
                </p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h2 style="font-weight: 550;">Why sunshine hours matter for solar panels</h2>
                <p>The number of annual sunshine hours influences:</p>
                <ul>
                    <li>Potential electricity generation from PV systems</li>
                    <li>Seasonal performance patterns</li>
                    </li>Financial payback and carbon savings</li>
                </ul>
                <p>Higher average sunshine typically increases annual generation potential, though system design and installation quality remain critical.</p>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h2 style="font-weight: 550;">Other factors that influence solar suitability</h2>
                <p>Sunshine hours are only one component of solar feasibility. Other important considerations include:</p>
                <h3 style="font-weight: 500;">1. Roof orientation and pitch</h3>
                <ul>
                    <li>South-facing roofs typically yield the highest output.</li>
                    <li>East–west orientations can still be viable.</li>
                    <li>Roof pitch affects seasonal performance.</li>
                </ul>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h3 style="font-weight: 500;">2. Roof area and usable space</h3>
                <ul>
                    <li>Sufficient uninterrupted surface area is required.</li>
                    <li>Chimneys, dormers and rooflights reduce usable space.</li>
                </ul>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h3 style="font-weight: 500;">3. Shading</h3>
                <ul>
                    <li>Trees, adjacent buildings and roof obstructions can significantly reduce output.</li>
                    <li>Even partial shading can affect system performance.</li>
                </ul>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h3 style="font-weight: 500;">4. Roof condition and structure</h3>
                <ul>
                    <li>Roof materials and structural integrity must be suitable for panel mounting.</li>
                    <li>Future roof replacement plans may influence installation timing.</li>
                </ul>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h3 style="font-weight: 500;">5. Planning and local constraints</h3>
                <ul>
                    <li>Conservation areas or listed buildings may require additional permissions.</li>
                </ul>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h3 style="font-weight: 500;">6. Electrical infrastructure</h3>
                <ul>
                    <li>Consumer unit capacity and grid connection constraints may influence system design.</li>
                </ul>
            </div>
            <hr style="border-top: 1px solid #7c7c7c; border-bottom: 0; margin-bottom: 10px;">
            <div>
                <h2 style="font-weight: 550;">What this visual layer means in IRIS</h2>
                <p>The hours of sunlight panel:</p>
                <ul>
                    <li>Provides area-level insight into available solar resource.</li>
                    <li>Supports early-stage consideration of solar technologies.</li>
                    <li>Does not confirm technical feasibility at property level.</li>
                </ul>
                <p>
                    Future iterations of IRIS may incorporate additional property-specific dimensions, such as orientation, roof geometry and shading, to provide more granular solar suitability insight.
                </p>
                <p>
                    At present, this indicator should be used as contextual information to inform further assessment, rather than as a standalone determination of suitability.
                </p>
            </div>
        `),
    };

    public onDownloadableWarningGuidanceMoreInfoClick(): void {
        const dialogRef = this.#dialog.open(DownloadableContentModal, {
            data: this.downloadableWarningGuidanceMoreInfo,
            panelClass: 'section-item-warning-guidance-more-info-modal',
        });

        dialogRef.afterClosed().subscribe();
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
