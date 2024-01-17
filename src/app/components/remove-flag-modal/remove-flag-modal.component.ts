import {
  Component,
  ChangeDetectionStrategy,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { BuildingModel } from '@core/models/building.model';
import { InvalidateFlagReason } from '@core/enums/invalidate-flag-reason';
import '@arc-web/components/src/components/ph-icon/warning/ph-icon-warning';

export type RemoveFlagModalData = BuildingModel;

export type RemoveFlagModalResult = InvalidateFlagReason;

@Component({
  standalone: true,
  selector: 'c477-remove-flag-modal',
  templateUrl: './remove-flag-modal.component.html',
  styleUrls: ['./remove-flag-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
})
export class RemoveFlagModalComponent {
  public readonly data = inject<RemoveFlagModalData>(MAT_DIALOG_DATA);
  public readonly dialogRef = inject(MatDialogRef<RemoveFlagModalComponent>);
  public readonly reason = new FormControl<InvalidateFlagReason | null>(null, [
    Validators.required,
  ]);

  public readonly reasons = InvalidateFlagReason;

  public onRemoveFlag(): void {
    this.reason.markAsTouched();
    if (this.reason.invalid) return;
    this.dialogRef.close(this.reason.value);
  }
}
