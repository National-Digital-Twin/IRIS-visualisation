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
        content: this.#sanitizer.bypassSecurityTrustHtml(`
            <h2 style="font-weight: 550;">Hours of sunlight and retrofitting UK housing</h2>
            <div style="display: flex; justify-content: center; padding: 30px;">
                <p><em>More information coming soon</em></p>
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
