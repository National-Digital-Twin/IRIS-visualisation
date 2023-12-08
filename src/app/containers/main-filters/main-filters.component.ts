import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '@components/label/label.component';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

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
export class MainFiltersComponent {}
