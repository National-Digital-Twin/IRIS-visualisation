import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BACKEND_API_ENDPOINT } from '@core/tokens/backend-endpoint.token';
import { Observable } from 'rxjs';

interface UserDetails {
    email: string;
}

@Injectable({ providedIn: 'root' })
export class UserDetailsService {
    readonly #http: HttpClient = inject(HttpClient);
    readonly #backendApiEndpoint = inject(BACKEND_API_ENDPOINT);

    public get(): Observable<UserDetails> {
        return this.#http.get<UserDetails>(`${this.#backendApiEndpoint}/user-details`, {
            withCredentials: true,
        });
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
