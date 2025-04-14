import { Component, OnInit, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { PosthogService } from '@core/services/posthog.service';

@Component({
    selector: 'c477-root',
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
    readonly #matIconReg = inject(MatIconRegistry);
    readonly #posthogService = inject(PosthogService);
    readonly #domSanitizer = inject(DomSanitizer);

    public ngOnInit(): void {
        this.#posthogService.initialize();
        this.#matIconReg.setDefaultFontSetClass('material-symbols-outlined');
        this.#matIconReg.addSvgIcon('accessibility_custom', this.#domSanitizer.bypassSecurityTrustResourceUrl('../assets/icons/accessibility.svg'));
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
