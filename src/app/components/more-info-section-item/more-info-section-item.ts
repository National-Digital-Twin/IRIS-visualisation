import { CdkAccordionModule } from '@angular/cdk/accordion';
import { Component, inject, input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { SafeHtml } from '@angular/platform-browser';
import { DownloadableContentModal } from '@components/downloadable-content-modal/downloadable-content-modal';

@Component({
    selector: 'c477-more-info-section-item',
    imports: [CdkAccordionModule, MatIconModule, MatDividerModule],
    templateUrl: './more-info-section-item.html',
    styleUrl: './more-info-section-item.scss',
})
export class MoreInfoSectionItem {
    readonly #dialog = inject(MatDialog);

    public headerInput = input.required<string>();
    public subtitleInput = input<string | undefined>(undefined);
    public warnInput = input<boolean>(false);
    public warningGuidanceInput = input<string | undefined>(undefined);
    public downloadableWarningGuidanceMoreInfoInput = input<{ pdfFilename: string; content: SafeHtml } | undefined>(undefined);

    public onDownloadableWarningGuidanceMoreInfoClick(): void {
        const downloadableWarningGuidanceMoreInfo = this.downloadableWarningGuidanceMoreInfoInput();

        if (downloadableWarningGuidanceMoreInfo) {
            const dialogRef = this.#dialog.open(DownloadableContentModal, {
                data: downloadableWarningGuidanceMoreInfo,
                panelClass: 'section-item-warning-guidance-more-info-modal',
            });

            dialogRef.afterClosed().subscribe();
        }
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
