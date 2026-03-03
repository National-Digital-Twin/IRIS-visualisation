import { inputBinding, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuildingSunlightHoursDataModel } from '@core/models/building.weather.data.model';
import { HoursOfSunlightSectionItem } from './hours-of-sunlight-section-item';

function generateBuildingSunlightHoursDataModel(min: number, max: number): BuildingSunlightHoursDataModel {
    return {
        sunlightHours: Math.random() * (max - min + 1) + min,
        dailySunlightHours: Math.random() * 25,
    };
}

describe('HoursOfSunlightSectionItem', () => {
    let component: HoursOfSunlightSectionItem;
    let fixture: ComponentFixture<HoursOfSunlightSectionItem>;

    const dataInput = signal<BuildingSunlightHoursDataModel>(generateBuildingSunlightHoursDataModel(0, 5000));

    beforeEach(async () => {
        dataInput.set(generateBuildingSunlightHoursDataModel(0, 5000));

        await TestBed.configureTestingModule({
            imports: [HoursOfSunlightSectionItem],
        }).compileComponents();

        fixture = TestBed.createComponent(HoursOfSunlightSectionItem, { bindings: [inputBinding('dataInput', dataInput)] });
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
