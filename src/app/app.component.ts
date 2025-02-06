import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PosthogService } from '@core/services/posthog.service';

@Component({
    selector: 'c477-root',
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
    #posthogService = inject(PosthogService);

    public ngOnInit(): void {
        this.#posthogService.initialize();
    }
}
