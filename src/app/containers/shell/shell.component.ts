import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MapComponent } from '@components/map/map.component';

@Component({
  selector: 'c477-shell',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ShellComponent {
  title = 'C477 Visualisation';
}
