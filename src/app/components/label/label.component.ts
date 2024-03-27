import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'c477-label',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './label.component.html',
  styleUrl: './label.component.css',
})
export class LabelComponent {
  @Input() epcRating?: string;
  @Input() sapPoints?: string;
  @Input() expired?: boolean = false;
}
