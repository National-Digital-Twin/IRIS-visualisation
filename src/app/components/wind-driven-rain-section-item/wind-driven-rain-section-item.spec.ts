import { inputBinding, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BuildingWindDrivenRainDataModel } from '@core/models/building.weather.data.model';
import { WindDrivenRainSectionItem } from './wind-driven-rain-section-item';

function generateBuildingWindDrivenRainData(min: number, max: number): BuildingWindDrivenRainDataModel {
    return {
        northFourDegreesMedian: Math.random() * (max - min + 1) + min,
        northEastFourDegreesMedian: Math.random() * (max - min + 1) + min,
        eastFourDegreesMedian: Math.random() * (max - min + 1) + min,
        southEastFourDegreesMedian: Math.random() * (max - min + 1) + min,
        southFourDegreesMedian: Math.random() * (max - min + 1) + min,
        southWestFourDegreesMedian: Math.random() * (max - min + 1) + min,
        westFourDegreesMedian: Math.random() * (max - min + 1) + min,
        northWestFourDegreesMedian: Math.random() * (max - min + 1) + min,
        northTwoDegreesMedian: Math.random() * (max - min + 1) + min,
        northEastTwoDegreesMedian: Math.random() * (max - min + 1) + min,
        eastTwoDegreesMedian: Math.random() * (max - min + 1) + min,
        southEastTwoDegreesMedian: Math.random() * (max - min + 1) + min,
        southTwoDegreesMedian: Math.random() * (max - min + 1) + min,
        southWestTwoDegreesMedian: Math.random() * (max - min + 1) + min,
        westTwoDegreesMedian: Math.random() * (max - min + 1) + min,
        northWestTwoDegreesMedian: Math.random() * (max - min + 1) + min,
    };
}

describe('WindDrivenRainSectionItem', () => {
    let component: WindDrivenRainSectionItem;
    let fixture: ComponentFixture<WindDrivenRainSectionItem>;

    const dataInput = signal<BuildingWindDrivenRainDataModel>(generateBuildingWindDrivenRainData(0, 500));
    const warnInput = signal<boolean>(false);

    beforeEach(async () => {
        dataInput.set(generateBuildingWindDrivenRainData(0, 500));
        warnInput.set(false);

        await TestBed.configureTestingModule({
            imports: [WindDrivenRainSectionItem],
        }).compileComponents();

        fixture = TestBed.createComponent(WindDrivenRainSectionItem, {
            bindings: [inputBinding('dataInput', dataInput), inputBinding('warnInput', warnInput)],
        });
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not set subtitle when warn is false', () => {
        const subtitleElement = fixture.debugElement.query(By.css('.section-item-subtitle'));
        expect(subtitleElement).toBeFalsy();
    });

    it('should create the data table for the wind driven rain 4 degrees section when data is provided', async () => {
        warnInput.set(true);

        fixture.detectChanges();
        await fixture.whenStable();

        const subtitleElements = fixture.debugElement.queryAll(By.css('.section-item-subtitle'));
        expect(subtitleElements).toHaveLength(2);
        expect(subtitleElements[0].nativeElement.textContent).toBe('Within an area of high wind-driven rain');
        expect(subtitleElements[1].nativeElement.textContent).toBe('Within an area of high wind-driven rain');
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
