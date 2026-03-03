export type BuildingWindDrivenRainDataModel = {
    northTwoDegreesMedian: number;
    northEastTwoDegreesMedian: number;
    eastTwoDegreesMedian: number;
    southEastTwoDegreesMedian: number;
    southTwoDegreesMedian: number;
    southWestTwoDegreesMedian: number;
    westTwoDegreesMedian: number;
    northWestTwoDegreesMedian: number;
    northFourDegreesMedian: number;
    northEastFourDegreesMedian: number;
    eastFourDegreesMedian: number;
    southEastFourDegreesMedian: number;
    southFourDegreesMedian: number;
    southWestFourDegreesMedian: number;
    westFourDegreesMedian: number;
    northWestFourDegreesMedian: number;
};

export type BuildingHotSummerDaysDataModel = {
    baselineMedian: number;
    degreesAboveBaselineMedian: Map<number, number>;
};

export type BuildingIcingDaysDataModel = {
    icingDays: number;
};

export type BuildingSunlightHoursDataModel = {
    sunlightHours: number;
    dailySunlightHours: number;
};

export type BuildingWeatherDataModel = {
    uprn: string;
    buildingWindDrivenRainDataModel?: BuildingWindDrivenRainDataModel;
    buildingHotSummerDaysDataModel?: BuildingHotSummerDaysDataModel;
    buildingIcingDaysDataModel?: BuildingIcingDaysDataModel;
    buildingSunlightHoursDataModel?: BuildingSunlightHoursDataModel;
};
