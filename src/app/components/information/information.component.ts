import { Component, Renderer2, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'c477-information',
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
  templateUrl: './information.component.html',
  styleUrl: './information.component.css',
})
export class InformationComponent {
  private renderer = inject(Renderer2);

  downloadUserGuide() {
    const link = this.renderer.createElement('a');
    link.setAttribute('target', '_self');
    link.setAttribute('href', 'assets/C477 - IRIS user guide v2.pdf');
    link.setAttribute('download', `C477 - IRIS user guide v2.pdf`);
    link.click();
    link.remove();
  }
}
