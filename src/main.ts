import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { ErrorHandler } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HandleHttpErrorInterceptor } from '@core/interceptors/handle-http-error.interceptor';
import { ExceptionService } from '@core/services/exception.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

fetch('configuration/config.json')
    .then((response) => response.json())
    .then((config) =>
        bootstrapApplication(AppComponent, {
            providers: [
                ...appConfig.providers,
                { provide: RUNTIME_CONFIGURATION, useValue: config },
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: HandleHttpErrorInterceptor,
                    multi: true,
                },
                { provide: ErrorHandler, useClass: ExceptionService },
                provideHttpClient(withFetch(), withInterceptorsFromDi()),
                provideAnimations(),
            ],
        }).catch((err) => console.error(err)),
    );
