import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { FeatureCollection, Geometry } from 'geojson';
import { Observable } from 'rxjs';

export interface WindDrivenRainLayerProperties {
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

export interface BuildingWindDrivenRainData {
    north_two_degrees_median: number;
    east_two_degrees_median: number;
    south_east_two_degrees_median: number;
    south_two_degrees_median: number;
    south_west_two_degrees_median: number;
    west_two_degrees_median: number;
    north_west_two_degrees_median: number;
    north_east_two_degrees_median: number;

    north_four_degrees_median: number;
    east_four_degrees_median: number;
    south_east_four_degrees_median: number;
    south_four_degrees_median: number;
    south_west_four_degrees_median: number;
    west_four_degrees_median: number;
    north_west_four_degrees_median: number;
    north_east_four_degrees_median: number;
}

export interface HotSummerDaysLayerProperties {
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

export interface BuildingHotSummerDaysData {
    hsd_baseline: number;
    hsd_1_5_degree_above_baseline: number;
    hsd_2_0_degree_above_baseline: number;
    hsd_2_5_degree_above_baseline: number;
    hsd_3_0_degree_above_baseline: number;
    hsd_4_0_degree_above_baseline: number;
}

export interface IcingDaysLayerProperties {
    objectid: number;
    icingdays: number;
}

export interface BuildingIcingDaysData {
    icing_days: number;
}

export interface BuildingSunlightHoursData {
    sunlight_hours: number;
    daily_sunlight_hours: number;
}

export interface BuildingExtremeWeatherSummaryData {
    affected_by_icing_days: boolean;
    affected_by_hot_summer_days: boolean;
    affected_by_wind_driven_rain: boolean;
}

@Injectable({ providedIn: 'root' })
export class ClimateDataService {
    readonly #http = inject(HttpClient);

    public getWindDrivenRainLayerData(): Observable<FeatureCollection<Geometry, WindDrivenRainLayerProperties>> {
        return this.#http.get<FeatureCollection<Geometry, WindDrivenRainLayerProperties>>(`/api/data/climate/wind-driven-rain`);
    }

    public getWindDrivenRainBuildingData(uprn: string): Observable<BuildingWindDrivenRainData> {
        return this.#http.get<BuildingWindDrivenRainData>(`/api/buildings/${uprn}/wind-driven-rain`);
    }

    public getHotSummerDaysLayerData(): Observable<FeatureCollection<Geometry, HotSummerDaysLayerProperties>> {
        return this.#http.get<FeatureCollection<Geometry, HotSummerDaysLayerProperties>>(`/api/data/climate/hot-summer-days`);
    }

    public getHotSummerDaysBuildingData(uprn: string): Observable<BuildingHotSummerDaysData> {
        return this.#http.get<BuildingHotSummerDaysData>(`/api/buildings/${uprn}/hot-summer-days`);
    }

    public getIcingDaysLayerData(): Observable<FeatureCollection<Geometry, IcingDaysLayerProperties>> {
        return this.#http.get<FeatureCollection<Geometry, IcingDaysLayerProperties>>(`/api/data/climate/icing-days`);
    }

    public getIcingDaysBuildingData(uprn: string): Observable<BuildingIcingDaysData> {
        return this.#http.get<BuildingIcingDaysData>(`/api/buildings/${uprn}/icing-days`);
    }

    public getSunlightHoursData(uprn: string): Observable<BuildingSunlightHoursData> {
        return this.#http.get<BuildingSunlightHoursData>(`/api/buildings/${uprn}/hours-of-sunlight`);
    }

    public getExtremeWeatherSummaryData(uprn: string): Observable<BuildingExtremeWeatherSummaryData> {
        return this.#http.get<BuildingExtremeWeatherSummaryData>(`/api/buildings/${uprn}/weather-summary`);
    }
}
