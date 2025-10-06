import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { MetabaseDashboardService } from './meta-dashboard.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'c477-metabase-dashboard',
    imports: [MatButtonModule, MatIconModule],
    templateUrl: './metabase-dashboard.html',
    styleUrl: './metabase-dashboard.scss',
})
export class MetabaseDashboardComponent implements OnInit {
    readonly #router = inject(Router);
    readonly #service = inject(MetabaseDashboardService);
    readonly #sanitizer = inject(DomSanitizer);
    public embeddedDashboardUrl: SafeResourceUrl | null = null;

    ngOnInit() {
        this.#service.getStaticEmbeddingUrl().subscribe((url) => {
            console.log(url);
            return (this.embeddedDashboardUrl = this.#sanitizer.bypassSecurityTrustResourceUrl(url));
        });
    }

    public handleReturnToMapView() {
        this.#router.navigateByUrl('/');
    }
}
