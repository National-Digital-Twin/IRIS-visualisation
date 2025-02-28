import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { InvalidateFlagReason } from '@core/enums/invalidate-flag-reason';
import { BuildingModel } from '@core/models/building.model';

export type RemoveFlagModalData = BuildingModel;

export type RemoveFlagModalResult = InvalidateFlagReason;

@Component({
    selector: 'c477-remove-flag-modal',
    templateUrl: './remove-flag-modal.component.html',
    styleUrl: './remove-flag-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
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
