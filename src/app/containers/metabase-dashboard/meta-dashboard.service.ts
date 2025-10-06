import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

interface EmbedUrlResponse {
    embedUrl: string;
}

@Injectable({
    providedIn: 'root',
})
export class MetabaseDashboardService {
    readonly #httpClient = inject(HttpClient);

    getStaticEmbeddingUrl(): Observable<string> {
        const res = this.#httpClient.get<EmbedUrlResponse>('/api/metabase-url');
        return res.pipe(map((data) => data.embedUrl));
    }
}
