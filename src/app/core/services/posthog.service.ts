import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '@environment';
import { posthog } from 'posthog-js';

@Injectable({
    providedIn: 'root',
})
export class PosthogService {
    constructor(private readonly router: Router) {
        /** capture route changes and send to posthog */
        if (environment.production) {
            this.router.events.subscribe((event) => {
                if (event instanceof NavigationEnd) {
                    posthog.capture('$pageview');
                }
            });
        }
    }

    /**
     * Initialize posthog.
     * Only called in production.
     */
    public initialize(): void {
        if (environment.production) {
            posthog.init(`${environment.posthog.apiKey}`, {
                api_host: 'https://eu.posthog.com',
                capture_pageview: false,
            });
        }
    }

    /**
     * Send custom event to posthog
     * @param event Event name
     * @param value property and value to send
     */
    public capture(event: string, value: Record<string, string>): void {
        if (environment.production) {
            posthog.capture(event, value);
        }
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
