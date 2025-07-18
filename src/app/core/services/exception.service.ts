import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse, HttpEvent, HttpStatusCode } from '@angular/common/http';
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '@environment';
import { EMPTY, OperatorFunction, catchError, switchMap, tap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExceptionService implements ErrorHandler {
    readonly #snackBar = inject(MatSnackBar);
    readonly #location = inject(DOCUMENT).location;

    /**
     * Handle Error.
     *
     * Handle errors that occur within the application.
     * Log the error to the console.
     */
    public handleError(error: Error): void {
        console.error(error);
    }

    /**
     * Handle Http Error.
     *
     * Handles errors that occure within HTTP requests streams.
     */
    public handleHttpError<T>(): OperatorFunction<HttpEvent<T>, HttpEvent<T>> {
        return (request$) =>
            request$.pipe(
                catchError((httpError: HttpErrorResponse) => {
                    const { url, status, error } = httpError;
                    const message = error instanceof ErrorEvent ? `Client-side/network error: ${error.message}` : `Server error ${status}: ${error.message}`;

                    if (url?.includes(environment.transparent_proxy.url) && (status === HttpStatusCode.Unauthorized || status === HttpStatusCode.Forbidden)) {
                        this.handleError(new Error(`Unauthorized API request. ${error.message}`));

                        return this.#snackBar
                            .open('Your session has expired. Please login again.', 'Ok', { duration: 0, politeness: 'assertive' })
                            .afterDismissed()
                            .pipe(
                                tap(() => this.#location.reload()),
                                switchMap(() => throwError(() => EMPTY)),
                            );
                    }

                    this.handleError(new Error(message));
                    return throwError(() => new Error(message));
                }),
            );
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
