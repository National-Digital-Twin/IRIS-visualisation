import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { BuildingModel } from '@core/models/building.model';

export type FlagModalData = BuildingModel[];

export type FlagModalResult = true;

@Component({
  standalone: true,
  selector: 'c477-flag-modal',
  templateUrl: './flag.modal.component.html',
  styleUrls: ['./flag.modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
})
export class FlagModalComponent {
  public readonly data = inject<FlagModalData>(MAT_DIALOG_DATA);
  public readonly dialogRef = inject(MatDialogRef<FlagModalComponent>);
  public readonly today = new Date(Date.now()).toLocaleDateString('en-GB');
}
