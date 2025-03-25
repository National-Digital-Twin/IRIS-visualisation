import { KeyValuePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { InvalidateFlagReason } from '@core/enums/invalidate-flag-reason';
import { BuildingModel } from '@core/models/building.model';

export type RemoveFlagModalData = BuildingModel;

export type RemoveFlagModalResult = InvalidateFlagReason;

@Component({
    imports: [
        KeyValuePipe,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogActions,
        MatDialogClose,
        MatDialogContent,
        MatDialogTitle,
        MatFormFieldModule,
        MatIconModule,
        MatSelectModule,
    ],
    selector: 'c477-remove-flag-modal',
    templateUrl: './remove-flag-modal.component.html',
    styleUrl: './remove-flag-modal.component.scss',
})
export class RemoveFlagModalComponent {
    readonly #data = inject<RemoveFlagModalData>(MAT_DIALOG_DATA);
    readonly #dialogRef = inject(MatDialogRef<RemoveFlagModalComponent>);

    public reason = new FormControl<InvalidateFlagReason | null>(null, [Validators.required]);
    public reasons = InvalidateFlagReason;

    get data(): BuildingModel {
        return this.#data;
    }

    public onRemoveFlag(): void {
        this.reason.markAsTouched();
        if (this.reason.invalid) return;
        this.#dialogRef.close(this.reason.value);
    }
}
