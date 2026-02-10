import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BuildingWindDrivenRainData } from '@core/services/climate-data.service';
import { WindDrivenRainSectionItem } from './wind-driven-rain-section-item';

function generateBuildingWindDrivenRainData(min: number, max: number): BuildingWindDrivenRainData {
    return {
        north_four_degrees_median: Math.random() * (max - min + 1) + min,
        north_east_four_degrees_median: Math.random() * (max - min + 1) + min,
        east_four_degrees_median: Math.random() * (max - min + 1) + min,
        south_east_four_degrees_median: Math.random() * (max - min + 1) + min,
        south_four_degrees_median: Math.random() * (max - min + 1) + min,
        south_west_four_degrees_median: Math.random() * (max - min + 1) + min,
        west_four_degrees_median: Math.random() * (max - min + 1) + min,
        north_west_four_degrees_median: Math.random() * (max - min + 1) + min,
        north_two_degrees_median: Math.random() * (max - min + 1) + min,
        north_east_two_degrees_median: Math.random() * (max - min + 1) + min,
        east_two_degrees_median: Math.random() * (max - min + 1) + min,
        south_east_two_degrees_median: Math.random() * (max - min + 1) + min,
        south_two_degrees_median: Math.random() * (max - min + 1) + min,
        south_west_two_degrees_median: Math.random() * (max - min + 1) + min,
        west_two_degrees_median: Math.random() * (max - min + 1) + min,
        north_west_two_degrees_median: Math.random() * (max - min + 1) + min,
    };
}

describe('WindDrivenRainSectionItem', () => {
    let component: WindDrivenRainSectionItem;
    let fixture: ComponentFixture<WindDrivenRainSectionItem>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WindDrivenRainSectionItem],
        }).compileComponents();

        fixture = TestBed.createComponent(WindDrivenRainSectionItem);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not create the data table for the wind driven rain 4 degrees section if no data is provided', () => {
        const fourDegressTableElement = fixture.debugElement.query(By.css('[data-testid="4-degress-table"]'));
        expect(fourDegressTableElement).toBeFalsy();
    });

    it('should not create the data table for the wind driven rain 2 degrees section if no data is provided', () => {
        const twoDegressTableElement = fixture.debugElement.query(By.css('[data-testid="2-degress-table"]'));
        expect(twoDegressTableElement).toBeFalsy();
    });

    it('should create the data table for the wind driven rain 4 degrees section when data is provided', async () => {
        component.data = generateBuildingWindDrivenRainData(0, 500);

        fixture.detectChanges();
        await fixture.whenStable();

        const fourDegreesTableElement = fixture.debugElement.query(By.css('[data-testid="4-degrees-table"]')).nativeElement;
        expect(fourDegreesTableElement).toBeTruthy();
    });

    it('should create the data table for the wind driven rain 2 degrees section when data is provided', async () => {
        component.data = generateBuildingWindDrivenRainData(0, 500);

        fixture.detectChanges();
        await fixture.whenStable();

        const twoDegreesTableElement = fixture.debugElement.query(By.css('[data-testid="2-degrees-table"]')).nativeElement;
        expect(twoDegreesTableElement).toBeTruthy();
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
