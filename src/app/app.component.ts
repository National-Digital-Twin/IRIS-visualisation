import { Component, OnInit, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
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

    public ngOnInit(): void {
        this.#posthogService.initialize();
        this.#matIconReg.setDefaultFontSetClass('material-symbols-outlined');
    }
}
