import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
    selector: 'c477-other-dashboard',
    imports: [MatButtonModule, MatIconModule],
    templateUrl: './other-dashboard.html',
    styleUrl: './other-dashboard.scss',
})
export class OtherDashboardComponent {
    readonly #router = inject(Router);

    public handleReturnToMapView() {
        this.#router.navigateByUrl('/');
    }
}
