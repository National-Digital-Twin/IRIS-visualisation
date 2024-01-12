import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DownloadDataWarningData } from '@core/models/download-data-warning.model';

@Component({
  selector: 'c477-download-warning',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatIconModule,
  ],
  templateUrl: './download-warning.component.html',
  styleUrl: './download-warning.component.css',
})
export class DownloadWarningComponent {
  readonly data = inject<DownloadDataWarningData>(MAT_DIALOG_DATA);
}
