import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'c477-results-panel-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './results-panel-button.component.html',
  styleUrl: './results-panel-button.component.css',
})
export class ResultsPanelButtonComponent implements OnDestroy {
  @Input() numberResults!: number;
  @Output() updatePanelStatus = new EventEmitter<boolean>();
  panelOpen: boolean = true;

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
    this.updatePanelStatus.emit(this.panelOpen);
  }

  ngOnDestroy(): void {
    this.panelOpen = true;
    this.updatePanelStatus.emit(this.panelOpen);
  }
}
