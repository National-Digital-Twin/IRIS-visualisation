import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HoursOfSunlightSectionItem } from './hours-of-sunlight-section-item';

describe('HoursOfSunlightSectionItem', () => {
    let component: HoursOfSunlightSectionItem;
    let fixture: ComponentFixture<HoursOfSunlightSectionItem>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HoursOfSunlightSectionItem],
        }).compileComponents();

        fixture = TestBed.createComponent(HoursOfSunlightSectionItem);
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
