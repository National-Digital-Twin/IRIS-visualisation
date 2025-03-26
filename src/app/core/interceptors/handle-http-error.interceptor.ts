import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ExceptionService } from '@core/services/exception.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HandleHttpErrorInterceptor implements HttpInterceptor {
    readonly #exceptionService = inject(ExceptionService);

    /**
     * Intercept Http Request.
     *
     * Intercept HTTP requests and handle errors that occur within HTTP request streams.
     */
    public intercept<T>(request: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
        return next.handle(request).pipe(this.#exceptionService.handleHttpError<T>());
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
