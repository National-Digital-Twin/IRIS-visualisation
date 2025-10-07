import { Component, ElementRef, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { SupersetDashboardService } from './superset-dashboard-service';

@Component({
    selector: 'c477-superset-dashboard',
    imports: [MatButtonModule, MatIconModule],
    templateUrl: './superset-dashboard.html',
    styleUrl: './superset-dashboard.scss',
})
export class SupersetComponent implements OnInit {
    readonly #router = inject(Router);
    readonly #supersetDashboardService = inject(SupersetDashboardService);
    readonly #elementRef = inject(ElementRef);

    ngOnInit(): void {
        this.embeddSupersetDashboard();
    }

    public handleReturnToMapView() {
        this.#router.navigateByUrl('/');
    }

    embeddSupersetDashboard(): void {
        const supersetDashboardElement = this.#elementRef.nativeElement.querySelector('#superset-embedded-dashboard');

        if (supersetDashboardElement) {
            this.#supersetDashboardService.embeddDashboard().subscribe(
                () => {
                    const iframe = supersetDashboardElement.querySelector('iframe');
                    if (iframe) {
                        iframe.style.width = '100%';
                        iframe.style.height = '1000px';
                    }
                },
                (error) => {
                    console.error(error);
                },
            );
        }
    }
}
