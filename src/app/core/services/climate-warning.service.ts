import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BuildingModel } from '@core/models/building.model';
import { ClimateWarningModel, ClimateWarning } from '@core/models/climate-warning.model';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClimateWarningService {
    private readonly http = inject(HttpClient);

    /**
     * Get climate warning data for a specific building
     * @param building The building to get climate warnings for
     * @returns Observable of climate warning data
     */
    public getClimateWarnings(building: BuildingModel): Observable<ClimateWarningModel> {
        return this.http.get<{ warnings: ClimateWarning[]; metadata: any }>('/assets/mock/climate-warnings.json').pipe(
            map((data) => ({
                propertyId: building.UPRN || 'unknown',
                address: {
                    streetNumber: this.extractStreetNumber(building.FullAddress),
                    streetName: this.extractStreetName(building.FullAddress),
                    city: this.extractCity(building.FullAddress),
                    postcode: this.extractPostcode(building.FullAddress),
                },
                epc: {
                    rating: building.EPC || 'D',
                    score: typeof building.SAPPoints === 'number' ? building.SAPPoints : 64.0,
                },
                warnings: data.warnings,
            })),
        );
    }

    private extractStreetNumber(address: string): string {
        const match = address.match(/^(\d+)/);
        return match ? match[1] : '';
    }

    private extractStreetName(address: string): string {
        const match = address.match(/^\d+\s+(.+?)(?:\s*,\s*|$)/);
        return match ? match[1] : '';
    }

    private extractCity(address: string): string {
        const parts = address.split(',');
        return parts.length > 1 ? parts[parts.length - 2].trim() : '';
    }

    private extractPostcode(address: string): string {
        const match = address.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})$/);
        return match ? match[1] : '';
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
