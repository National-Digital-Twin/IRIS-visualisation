import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'c477-label',
    imports: [NgClass],
    templateUrl: './label.component.html',
    styleUrl: './label.component.scss',
})
export class LabelComponent {
    @Input() public epcRating?: string;
    @Input() public sapPoints?: string;
    @Input() public expired?: boolean = false;
}
