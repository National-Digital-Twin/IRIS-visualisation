import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WindDrivenRainSectionItem } from './wind-driven-rain-section-item';

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
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
