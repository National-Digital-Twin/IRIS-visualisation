import { Pipe, PipeTransform } from '@angular/core';
/*
 * Add spaces between a lowercase letter and an uppercase letter
 * also add space between a lowercase letter and 2002
 * and 2002 and an uppercase letter to handle glazing
 */

@Pipe({
    standalone: true,
    name: 'pascalCaseSpace',
})
export class PascalCaseSpacePipe implements PipeTransform {
    public transform(value: string): string {
        return value
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/(2002)([A-Z])/g, '$1 $2')
            .replace(/([a-z])(2002)/g, '$1 $2');
    }
}
