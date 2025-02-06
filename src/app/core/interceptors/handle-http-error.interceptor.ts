import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ExceptionService } from '@core/services/exception.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HandleHttpErrorInterceptor implements HttpInterceptor {
    #exceptionService = inject(ExceptionService);

    /**
     * Intercept Http Request.
     *
     * Intercept HTTP requests and handle errors that occur within HTTP request streams.
     */
    public intercept<T>(request: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
        return next.handle(request).pipe(this.#exceptionService.handleHttpError<T>());
    }
}
