import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { BuildingModel } from '@core/models/building.model';

export type FlagModalData = BuildingModel[];

export type FlagModalResult = true;

@Component({
    selector: 'c477-flag-modal',
    imports: [CommonModule, MatDialogModule, MatButtonModule],
    templateUrl: './flag.modal.component.html',
    styleUrl: './flag.modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlagModalComponent {
    readonly #data = inject<FlagModalData>(MAT_DIALOG_DATA);

    public today = new Date(Date.now()).toLocaleDateString('en-GB');

    get data(): FlagModalData {
        return this.#data;
    }
}
