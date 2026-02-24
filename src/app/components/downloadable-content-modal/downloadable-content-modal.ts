import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'c477-downloadable-content-modal',
    imports: [MatButtonModule, MatDialogContent, MatDialogActions, MatDialogClose, MatIconModule],
    templateUrl: './downloadable-content-modal.html',
    styleUrl: './downloadable-content-modal.scss',
})
export class DownloadableContentModal {
    readonly #dialogRef = inject(MatDialogRef<DownloadableContentModal>);

    public readonly data = inject<{ pdfFilepath?: string; pdfFilename?: string; content: string }>(MAT_DIALOG_DATA);
    public readonly pdfFilePathAndName = this.data.pdfFilepath && this.data.pdfFilename ? `${this.data.pdfFilepath}/${this.data.pdfFilename}` : undefined;

    public onDownload(): void {
        const downloadLinkElement = document.querySelector('#downloadLink') as HTMLElement;
        downloadLinkElement.click();
        this.#dialogRef.close();
    }
}
