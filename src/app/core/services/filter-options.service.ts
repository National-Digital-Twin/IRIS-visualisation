// src/app/core/services/filter-options.service.ts
import { Injectable } from '@angular/core';
import { EPCRating } from '@core/enums';

@Injectable({ providedIn: 'root' })
export class FilterOptionsService {
    // Common building properties
    public readonly buildFormOptions = ['Detached', 'Semi-Detached', 'End-Terrace', 'Mid-Terrace', 'Enclosed End-Terrace', 'Enclosed Mid-Terrace', 'NoData'];

    public readonly windowGlazingOptions = [
        'SingleGlazedWindow',
        'DoubleGlazedAfter2002Window',
        'DoubleGlazedBefore2002Window',
        'TripleGlazedWindow',
        'NoData',
    ];

    public readonly wallConstructionOptions = [
        'CavityWall',
        'SolidBrickWall',
        'SolidStoneWall',
        'TimberFrameWall',
        'ParkHomeWall',
        'SystemBuiltWall',
        'NoData',
    ];

    public readonly wallInsulationOptions = ['NoInsulation', 'FullyInsulated', 'PartiallyInsulated', 'AssumedLimitedInsulation', 'NoData'];

    public readonly floorConstructionOptions = ['SolidFloor', 'SuspendedTimberFloor', 'NoData'];

    public readonly floorInsulationOptions = ['NoInsulation', 'FullyInsulated', 'PartiallyInsulated', 'AssumedLimitedInsulation', 'NoData'];

    public readonly roofConstructionOptions = ['FlatRoof', 'PitchedRoof', 'NoData'];

    public readonly roofInsulationLocationOptions = ['NoInsulation', 'CeilingLevel', 'RafterLevel', 'FlatRoofInsulation', 'NoData'];

    public readonly roofInsulationThicknessOptions = ['0mm', '12mm', '25mm', '50mm', '75mm', '100mm', '150mm', '200mm', '250mm', '270mm+', 'NoData'];

    public readonly epcExpiryOptions = ['EPC In Date', 'EPC Expired'];

    public readonly epcRatingOptions = Object.keys(EPCRating).filter((key) => isNaN(Number(key)));

    // Helper method to get available years from a dataset
    public getAvailableYears(buildings: any[]): string[] {
        const years = new Set<string>();

        buildings.forEach((building) => {
            if (building.LodgementDate) {
                try {
                    const year = new Date(building.LodgementDate).getFullYear().toString();
                    if (!isNaN(parseInt(year))) {
                        years.add(year);
                    }
                } catch (e) {
                    console.error('Error parsing date:', building.LodgementDate);
                }
            }
        });

        return Array.from(years).sort((a, b) => parseInt(a) - parseInt(b));
    }

    // Helper method to get available postcodes from a dataset
    public getAvailablePostcodes(buildings: any[]): string[] {
        const postcodes = new Set<string>();

        buildings.forEach((building) => {
            if (building.PostCode) {
                postcodes.add(building.PostCode);
            }
        });

        return Array.from(postcodes).sort();
    }

    // Helper to check if a value exists in the dataset
    public isValueInDataset(value: string, property: string, buildings: any[]): boolean {
        if (!value || !property) return false;

        return buildings.some((building) => {
            const propValue = building[property];
            return propValue === value;
        });
    }
}
