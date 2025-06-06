import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BACKEND_API_ENDPOINT } from '@core/tokens/backend-endpoint.token';
import { Observable } from 'rxjs';

interface RedirectUrl {
    href: string;
}

interface SignoutLinksResponse {
    oauth2SignoutUrl: string;
    redirectUrl: RedirectUrl;
}

@Injectable({ providedIn: 'root' })
export class SignoutService {
    readonly #http: HttpClient = inject(HttpClient);
    readonly #backendApiEndpoint: string = inject(BACKEND_API_ENDPOINT);

    public signoutLinks: SignoutLinksResponse | undefined = undefined;

    constructor() {
        this.getSignoutLinks().subscribe((response) => {
            this.signoutLinks = response;
        });
    }

    private getSignoutLinks(): Observable<SignoutLinksResponse> {
        return this.#http.get<SignoutLinksResponse>(`${this.#backendApiEndpoint}/signout-links`);
    }

    // This method uses fetch because we do not want to automatically redirect the user to the location provided
    // by the response of the HTTP request as it will return a 302 response when successful.
    public voidSession(): Promise<object> {
        if (this.signoutLinks) {
            return fetch(this.signoutLinks.oauth2SignoutUrl, { method: 'GET', redirect: 'manual', credentials: 'include' });
        }

        return Promise.reject(new Error('No sign out links available to void the session!'));
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
