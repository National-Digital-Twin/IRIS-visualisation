import { Component, Input, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, FormControl } from '@angular/forms';

@Component({
  selector: 'c477-multi-button-filter',
  standalone: true,
  imports: [CommonModule, MatButtonToggleModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiButtonFilterComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MultiButtonFilterComponent),
      multi: true,
    },
  ],
  templateUrl: './multi-button-filter.component.html',
  styleUrl: './multi-button-filter.component.css',
})
export class MultiButtonFilterComponent implements OnInit {
  @Input() title!: string;
  @Input() options!: {
    [key: string]: string;
  };
  optionKeys: string[] = [];
  formControl = new FormControl();

  ngOnInit(): void {
    this.optionKeys = Object.keys(this.options);
  }
}
