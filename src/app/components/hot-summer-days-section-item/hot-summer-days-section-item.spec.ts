import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BuildingHotSummerDaysData } from '@core/services/climate-data.service';
import { HotSummerDaysSectionItem } from './hot-summer-days-section-item';

function generateBuildingHotSummerDaysData(min: number, max: number): BuildingHotSummerDaysData {
    return {
        hsd_baseline: Math.random() * (max - min + 1) + min,
        hsd_1_5_degree_above_baseline: Math.random() * (max - min + 1) + min,
        hsd_2_0_degree_above_baseline: Math.random() * (max - min + 1) + min,
        hsd_2_5_degree_above_baseline: Math.random() * (max - min + 1) + min,
        hsd_3_0_degree_above_baseline: Math.random() * (max - min + 1) + min,
        hsd_4_0_degree_above_baseline: Math.random() * (max - min + 1) + min,
    };
}

describe('HotSummerDaysSectionItem', () => {
    let component: HotSummerDaysSectionItem;
    let fixture: ComponentFixture<HotSummerDaysSectionItem>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HotSummerDaysSectionItem],
        }).compileComponents();

        fixture = TestBed.createComponent(HotSummerDaysSectionItem);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not create the data table when no data is provided', () => {
        const dataTableElement = fixture.debugElement.query(By.css('.data-table'));
        expect(dataTableElement).toBeFalsy();
    });

    it('should create the data table when data is provided', async () => {
        component.data = generateBuildingHotSummerDaysData(0, 25);

        fixture.detectChanges();
        await fixture.whenStable();

        const dataTableElement = fixture.debugElement.query(By.css('.data-table'));
        expect(dataTableElement).toBeTruthy();
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
