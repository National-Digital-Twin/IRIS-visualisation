import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '@components/label/label.component';

@Component({
  selector: 'c477-legend',
  standalone: true,
  imports: [CommonModule, LabelComponent],
  templateUrl: './legend.component.html',
  styleUrl: './legend.component.css',
})
export class LegendComponent {
  epcItems = [
    {
      rating: 'A',
      sapPoints: '92 +',
    },
    {
      rating: 'B',
      sapPoints: '81-91',
    },
    {
      rating: 'C',
      sapPoints: '69-80',
    },
    {
      rating: 'D',
      sapPoints: '55-68',
    },
    {
      rating: 'E',
      sapPoints: '39-54',
    },
    {
      rating: 'F',
      sapPoints: '21-38',
    },
    {
      rating: 'G',
      sapPoints: '1-20',
    },
    {
      rating: 'none',
      sapPoints: '',
    },
    {
      rating: 'avg',
      sapPoints: '1-20',
    },
  ];
}
