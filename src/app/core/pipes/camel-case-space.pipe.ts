import { Pipe, PipeTransform } from '@angular/core';
/*
 * Add spaces between a lowercase letter and an uppercase letter
 * also add space between a lowercase letter and 2002
 * and 2002 and an uppercase letter to handle glazing
 */

@Pipe({
    standalone: true,
    name: 'camelCaseSpace',
})
export class CamelCaseSpacePipe implements PipeTransform {
    public transform(value: string): string {
        return value
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/(2002)([A-Z])/g, '$1 $2')
            .replace(/([a-z])(2002)/g, '$1 $2');
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
