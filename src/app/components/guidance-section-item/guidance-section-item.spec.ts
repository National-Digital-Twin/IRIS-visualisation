import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuidanceSectionItem } from './guidance-section-item';

describe('GuidanceSectionItem', () => {
    let component: GuidanceSectionItem;
    let fixture: ComponentFixture<GuidanceSectionItem>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GuidanceSectionItem],
        }).compileComponents();

        fixture = TestBed.createComponent(GuidanceSectionItem);
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
