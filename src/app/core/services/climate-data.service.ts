import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { FeatureCollection, Geometry } from 'geojson';
import { Observable } from 'rxjs';

export interface WindDrivenRainProperties {
    shape: string;
    wdr20_0: number;
    wdr40_0: number;
    x_coord: number;
    y_coord: number;
    wdr20_45: number;
    wdr20_90: number;
    wdr40_45: number;
    wdr40_90: number;
    wdr20_135: number;
    wdr20_180: number;
    wdr20_225: number;
    wdr20_270: number;
    wdr20_315: number;
    wdr40_135: number;
    wdr40_180: number;
    wdr40_225: number;
    wdr40_270: number;
    wdr40_315: number;
}

export interface HotSummerDaysProperties {
    objectid: number;
    latitude: number;
    longitude: number;
    hsd_15_median: number;
    hsd_20_median: number;
    hsd_25_median: number;
    hsd_30_median: number;
    hsd_40_median: number;
    hsd_baseline_01_20_median: number;
}

export interface IcingDaysProperties {
    objectid: number;
    icingdays: number;
}

@Injectable({ providedIn: 'root' })
export class ClimateDataService {
    readonly #http = inject(HttpClient);

    public getWindDrivenRainData(): Observable<FeatureCollection<Geometry, WindDrivenRainProperties>> {
        return this.#http.get<FeatureCollection<Geometry, WindDrivenRainProperties>>(`/api/data/climate/wind-driven-rain`);
    }

    public getHotSummerDaysData(): Observable<FeatureCollection<Geometry, HotSummerDaysProperties>> {
        return this.#http.get<FeatureCollection<Geometry, HotSummerDaysProperties>>(`/api/data/climate/hot-summer-days`);
    }

    public getIcingDaysData(): Observable<FeatureCollection<Geometry, IcingDaysProperties>> {
        return this.#http.get<FeatureCollection<Geometry, IcingDaysProperties>>(`/api/data/climate/icing-days`);
    }
}
