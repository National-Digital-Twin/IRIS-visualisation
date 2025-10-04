import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';
import { Injectable } from '@angular/core';
import { embedDashboard } from '@superset-ui/embedded-sdk';
import { catchError, Observable, switchMap, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SupersetDashboardService {
    readonly #apiUrl = 'http://192.168.0.30:8088/api/v1/security';
    readonly #dashboardId = '12751be9-d820-45e9-a950-ac68b5950c0b';
    readonly #httpClient = inject(HttpClient);

    private fetchAccessToken(): Observable<any> {
        const body = {
            username: 'admin',
            password: 'admin',
            provider: 'db',
            refresh: true,
        };

        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

        return this.#httpClient.post<any>(`${this.#apiUrl}/login`, body, { headers });
    }

    private fetchGuestToken(accessToken: any): Observable<any> {
        const body = {
            resources: [
                {
                    type: 'dashboard',
                    id: this.#dashboardId,
                },
            ],
            rls: [],
            user: {
                username: 'guest',
                firstname: 'Guest',
                lastname: 'User',
            },
        };

        const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken['access_token']}` });

        return this.#httpClient.post<any>(`${this.#apiUrl}/guest_token/`, body, { headers });
    }

    getGuestToken(): Observable<any> {
        return this.fetchAccessToken().pipe(
            catchError((error) => {
                console.error(error);
                return throwError(error);
            }),
            switchMap((accessToken) => this.fetchGuestToken(accessToken)),
        );
    }

    embeddDashboard(): Observable<void> {
        return new Observable((observer) => {
            this.getGuestToken().subscribe(
                (token) => {
                    embedDashboard({
                        id: this.#dashboardId,
                        supersetDomain: 'http://192.168.0.30:8088',
                        mountPoint: document.getElementById('superset-embedded-dashboard')!,
                        fetchGuestToken: () => token['token'],
                    });
                    observer.next();
                    observer.complete();
                },
                (error) => observer.error(error),
            );
        });
    }
}
