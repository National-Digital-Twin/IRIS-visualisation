import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'c477-plotly-dashboard',
    imports: [RouterModule, MatButtonModule, MatIconModule],
    templateUrl: './plotly-dashboard.html',
    styleUrl: './plotly-dashboard.scss',
})
export class PlotlyDashboardComponent {
    readonly #router = inject(Router);

    public handleReturnToMapView() {
        this.#router.navigateByUrl('/');
    }
}
