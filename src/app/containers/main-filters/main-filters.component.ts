import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '@components/label/label.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FilterPanelComponent } from '@components/filter-panel/filter-panel.component';

@Component({
  selector: 'c477-main-filters',
  standalone: true,
  imports: [
    CommonModule,
    LabelComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './main-filters.component.html',
  styleUrl: './main-filters.component.css',
})
export class MainFiltersComponent {
  epcRatings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  constructor(public dialog: MatDialog) {}
  openAdvancedFilters() {
    this.dialog.open(FilterPanelComponent, {
      panelClass: 'filter-panel',
    });
  }
}
