import { Injectable, NgZone, inject, signal } from '@angular/core';
import { FilterProps } from '@core/models/advanced-filters.model';
import { BuildingMap, BuildingModel } from '@core/models/building.model';
import { MapLayerFilter } from '@core/models/layer-filter.model';
import { SETTINGS, SettingsService } from '@core/services/settings.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { MapLayerId } from '@core/types/map-layer-id';
import { booleanWithin } from '@turf/boolean-within';
import { featureCollection, point } from '@turf/helpers';
import { pointsWithinPolygon } from '@turf/points-within-polygon';
import { Feature, FeatureCollection, GeoJsonProperties, Geometry, MultiPoint, Point, Polygon } from 'geojson';
import { Expression, LngLat, PaintSpecification } from 'mapbox-gl';
import { DataService } from './data.service';
import { MapService } from './map.service';
import { SpatialQueryService } from './spatial-query.service';

type MapLayerPaintKeys = keyof PaintSpecification;

interface ExpressionAndMapLayerFilter {
    expression: Expression;
    mapLayerFilter: MapLayerFilter & { layerId: MapLayerId };
}

type CurrentExpressions = Record<MapLayerPaintKeys, ExpressionAndMapLayerFilter>;

@Injectable({
    providedIn: 'root',
})
export class UtilService {
    readonly #dataService = inject(DataService);
    readonly #mapService = inject(MapService);
    readonly #runtimeConfig = inject(RUNTIME_CONFIGURATION);
    readonly #settings = inject(SettingsService);
    readonly #spatialQueryService = inject(SpatialQueryService);
    readonly #zone = inject(NgZone);

    private readonly colorBlindMode = this.#settings.get(SETTINGS.ColorBlindMode);

    public multiDwelling = signal<string | undefined>(undefined);
    public selectedCardUPRN = signal<string | undefined>(undefined);
    public selectedUPRN = signal<string | undefined>(undefined);

    private readonly currentMapViewExpressions = signal<CurrentExpressions | undefined>(undefined);
    private readonly filteredBuildings = signal<BuildingMap | undefined>(undefined);
    private readonly filterProps = signal<FilterProps>({});

    public setFilters(filters: FilterProps): void {
        this.filterProps.set(filters);
    }

    /**
     * Create an array of building TOIDS and colours from buildings
     * @param addresses filtered addresses within map bounds
     * @returns MapboxGLJS expression
     */
    public createBuildingColourFilter(): void {
        const unfilteredBuildings = this.#dataService.buildings();

        if (!unfilteredBuildings || !Object.keys(unfilteredBuildings).length) {
            return;
        }

        const filterProps = this.filterProps();
        const buildings = this.filterBuildings(unfilteredBuildings, filterProps);

        const spatialFilter = this.#spatialQueryService.spatialFilterBounds();
        const filteredBuildings = this.filterBuildingsWithinBounds(buildings, spatialFilter);

        // set the filtered buildings so that the filters can search it
        this.filteredBuildings.set(filteredBuildings);

        /**
         * Get the default colors and patterns
         * for tolids.
         */
        const defaultColor = this.#runtimeConfig.epcColours['default'];
        const defaultPattern = 'default-pattern';

        /**
         * Create a new expressions object.
         *
         * This object is used to set both a combined
         * expression and filter options to a map layer.
         *
         * For single dwelling buildings, we use a solid
         * epc colour.  For multi dwelling buildings, we
         * use a patterned epc colour.
         */
        const expressions = {} as CurrentExpressions;
        expressions['fill-extrusion-color'] = {
            mapLayerFilter: {
                layerId: 'OS/TopographicArea_2/Building/1_3D-Single-Dwelling',
                expression: ['all', ['==', '_symbol', 4], ['in', 'TOID']],
            },
            expression: ['match', ['get', 'TOID']],
        };

        expressions['fill-extrusion-pattern'] = {
            mapLayerFilter: {
                layerId: 'OS/TopographicArea_2/Building/1_3D-Multi-Dwelling',
                expression: ['all', ['==', '_symbol', 4], ['in', 'TOID']],
            },
            expression: ['match', ['get', 'TOID']],
        };

        /**
         *  Add To Expression.
         *
         * Add a toid to an expression. The toid is only added
         * to the corresponding layer filter if it doesn't
         * already exist.
         */
        function addToidExpression(expressionKey: keyof CurrentExpressions, toid: string, value: string): void {
            expressions[expressionKey].expression.push(toid, value);

            if (expressions[expressionKey].mapLayerFilter.expression[2].includes(toid)) {
                return;
            }

            expressions[expressionKey].mapLayerFilter.expression[2].push(toid);
        }

        const flaggedTOIDS: string[] = [];
        /** TOIDS to exclude from the default layer */
        const excludeFromDefault: string[] = [];

        /** Iterate through the filtered toids */
        Object.keys(filteredBuildings).forEach((toid) => {
            /** Get the buildings UPRN's for a TOID */
            const dwellings: BuildingModel[] = filteredBuildings[toid];

            if (dwellings.length === 0) {
                /** No UPRNs for a TOID */

                addToidExpression('fill-extrusion-color', toid, defaultColor);
            } else if (dwellings.length === 1) {
                /* One UPRN for a TOID */

                const { EPC, Flagged } = dwellings[0];
                const color = EPC ? this.getEPCColour(EPC) : defaultPattern;

                /* Add toid to flagged array if flagged */
                if (Flagged) flaggedTOIDS.push(toid);
                /** Add toid to default layer array */
                excludeFromDefault.push(toid);

                /* if the building was originally a multi dwelling building
                 * before filtering then set an epc pattern over epc color */
                const multiDwelling = unfilteredBuildings![toid].length > 1;
                if (multiDwelling) {
                    const pattern = EPC ? this.getEPCPattern([EPC]) : defaultPattern;
                    addToidExpression('fill-extrusion-pattern', toid, pattern);
                } else {
                    addToidExpression('fill-extrusion-color', toid, color);
                }
            } else if (dwellings.length > 1) {
                /* Multiple UPRNs for a TOID */

                const epcs: string[] = [];
                const Flagged = dwellings.some(({ Flagged }) => Flagged);
                dwellings.forEach(({ EPC }) => {
                    if (EPC) epcs.push(EPC);
                });
                const pattern = epcs.length === 0 ? defaultPattern : this.getEPCPattern(epcs);

                /* Add toid to flagged array if flagged */
                if (Flagged) flaggedTOIDS.push(toid);
                /** Add toid to default layer array */
                excludeFromDefault.push(toid);

                addToidExpression('fill-extrusion-pattern', toid, pattern);
            }
        });

        /**
         * Set the default color and pattern for all
         * other toids not covered by the expression
         * but are filtered in the layer.
         */
        expressions['fill-extrusion-color'].expression.push(defaultColor);
        expressions['fill-extrusion-pattern'].expression.push(defaultPattern);

        /** apply the expression to update map layers */
        this.setCurrentMapExpression(expressions);

        /**
         * If there is a building currently selected, check if it's in the
         * filtered buildings data and if not deselect it
         */
        const selectedUPRN = this.#dataService.selectedUPRN();
        if (selectedUPRN) {
            const exists = this.uprnInFilteredBuildings(selectedUPRN, filteredBuildings);
            if (!exists) this.singleDwellingDeselected();
        }

        /**
         * if there are filters set filtered buildings to
         * display results
         */
        if (Object.keys(this.filterProps()).length || spatialFilter) {
            this.#dataService.setSelectedBuildings(Object.values(filteredBuildings));
        }

        /* Apply the flagged filter */
        this.#mapService.filterMapLayer({
            layerId: 'OS/TopographicArea_2/Building/1_3D-Dwelling-Flagged',
            expression: ['all', ['==', '_symbol', 4], ['in', 'TOID', ...flaggedTOIDS]],
        });
        /** Remove from toids from default layer so they're not rendered */
        this.#mapService.filterMapLayer({
            layerId: 'OS/TopographicArea_2/Building/1_3D',
            expression: ['all', ['==', '_symbol', 4], ['!in', 'TOID', ...excludeFromDefault]],
        });
    }

    /**
     * Get the mean EPC pattern for a TOID.
     *
     * Determins the average EPC rating for a TOID
     * then returns the corresponding EPC pattern.
     */
    public getEPCPattern(epcRatings: string[]): string {
        const colorBlindMode = this.colorBlindMode();
        const meanEPC = this.getMeanEPCValue(epcRatings).toLowerCase();
        return colorBlindMode ? `cb-${meanEPC}-pattern` : `${meanEPC}-pattern`;
    }

    public setCurrentMapExpression(expressions: CurrentExpressions): void {
        this.currentMapViewExpressions.set(expressions);
        this.updateMap();
    }

    public updateMap(): void {
        const currentExpressions = this.currentMapViewExpressions();
        if (currentExpressions === undefined) {
            return;
        }

        /*
         * For each of the expressions, set the
         * corresponding map layer filter and
         * expression for the layer.
         */
        Object.keys(currentExpressions).forEach((key) => {
            const expressionKey = key as keyof PaintSpecification;
            const { expression, mapLayerFilter } = currentExpressions[expressionKey];

            this.#mapService.filterMapLayer(mapLayerFilter);
            this.#mapService.setMapLayerPaint(mapLayerFilter.layerId, expressionKey, expression);
        });
    }

    /**
     *
     * @param epcRatings Array of EPC ratings
     * @returns The mean EPC rating
     */
    public getMeanEPCValue(epcRatings: string[]): string {
        let meanEPC = '';
        // assign a weighting to the EPC ratings
        const weightings: { [key: string]: number } = {
            A: 1,
            B: 2,
            C: 3,
            D: 4,
            E: 5,
            F: 6,
            G: 7,
        };
        const scores: number[] = [];
        // remove EPC none from the epcs to average
        const epcsToAverage = epcRatings.filter((rating) => rating !== 'none');
        if (epcsToAverage.length > 0) {
            // get the weighting for each epc value
            epcsToAverage.forEach((val) => scores.push(weightings[val]));
            const sum = scores.reduce((a, c) => a + c, 0);
            const mean = sum / scores.length;
            Object.keys(weightings).forEach((epc: string) => {
                // find the corresponding weighting for the mean
                if (Math.round(mean) === weightings[epc]) {
                    meanEPC = epc;
                }
            });
            return meanEPC;
        } else {
            return 'none';
        }
    }

    public getEPCColour(epcRating: string): string {
        const colorBlindMode = this.colorBlindMode();

        if (colorBlindMode) {
            return this.#runtimeConfig.epcColoursCD[epcRating || 'default'];
        } else {
            return this.#runtimeConfig.epcColours[epcRating || 'default'];
        }
    }

    public filterBuildingsWithinBounds(buildings: BuildingMap, spatialQueryBounds?: mapboxgl.Point[]): BuildingMap {
        /** get all features within current map bounds */
        const currentMapFeatures = this.#mapService.queryFeatures();

        // check if there is a user drawn spatial filter
        const spatialFilter = spatialQueryBounds ? this.#spatialQueryService.spatialFilterGeom() : undefined;
        const filteredToids: BuildingMap = {};
        currentMapFeatures
            .filter((feature) =>
                // if there is a spatial filter
                // remove any features outside of
                // the filter geometry
                spatialFilter ? booleanWithin(feature.geometry as Polygon, spatialFilter?.geometry as Polygon) : feature,
            )
            .sort((a, b) => (a.properties!.TOID < b.properties!.TOID ? -1 : 1))
            .map((feature) => {
                const building = buildings[feature.properties!.TOID];
                if (building) {
                    filteredToids[feature.properties!.TOID] = building;
                }
            });
        return filteredToids;
    }

    /**
     * This filters the building data by the user selected
     * filters
     * @param buildings all buildings data
     * @returns BuildingMap of filtered buildings
     */
    public filterBuildings(buildings: BuildingMap, filterProps: FilterProps): BuildingMap {
        if (Object.keys(filterProps).length === 0) {
            return buildings;
        }

        // convert building object to array to ease filtering
        const buildingsArray = Array.from(Object.values(buildings).flat());
        const filterKeys = Object.keys(filterProps);
        // filter buildings
        const filtered = buildingsArray.filter((building: BuildingModel) =>
            filterKeys.every((key) => {
                if (!filterProps[key as keyof FilterProps]?.length) {
                    return true;
                }
                // remove additional quotes for year filter
                // may not need this any more?
                const removeQuotes = filterProps[key as keyof FilterProps]?.map((k) => k.replace(/['"]+/g, ''));
                /** if flagged filter exists return the building if it has a flag */
                if (key === 'Flagged' && building.Flagged !== undefined) {
                    return true;
                }
                // compare inspection dates to 10 years ago
                else if (key === 'EPCExpiry') {
                    const tenYearsAgo = new Date();
                    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
                    if (
                        building.InspectionDate &&
                        ((filterProps[key as keyof FilterProps]?.includes('EPC Expired') && new Date(building.InspectionDate) < tenYearsAgo) ||
                            (filterProps[key as keyof FilterProps]?.includes('EPC In Date') && new Date(building.InspectionDate) >= tenYearsAgo))
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return removeQuotes?.includes(
                        // eslint-disable-next-line
                        // @ts-ignore
                        building[key as keyof BuildingModel],
                    );
                }
            }),
        );
        const filteredBuildings: BuildingMap = this.#dataService.mapBuildings(filtered);
        return filteredBuildings;
    }

    public epcExpired(inspectionDate?: string): boolean {
        if (!inspectionDate) {
            return false;
        }
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        return new Date(inspectionDate) < tenYearsAgo;
    }

    public epcInDate(inspectionDate?: string): boolean {
        if (!inspectionDate) {
            return false;
        }
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        return new Date(inspectionDate) >= tenYearsAgo;
    }

    /**
     * Find buildings based on TOID
     * @param toid toid of building
     * @returns array of buildings associated with toid
     */
    public getBuildings(toid: string): BuildingModel[] {
        const allBuildings = this.#dataService.buildings();
        if (!allBuildings) {
            return [];
        }
        const buildings = allBuildings[toid];
        if (buildings) {
            return buildings.flat();
        }
        return [];
    }

    public uprnInFilteredBuildings(uprn: string, buildings: BuildingMap): boolean {
        return Object.values(buildings)
            .flat()
            .some((b) => b.UPRN === uprn);
    }

    /**
     * Splits a full address and returns part
     * of the address
     * @param address full address string
     * @param index index of address part to return after
     * address is split
     * @returns address part
     */
    public splitAddress(index: number, fullAddress?: string): string {
        if (!fullAddress) {
            return '';
        }
        return fullAddress.split(',')[index];
    }

    /**
     * Find the addresses that are within each boundary
     * and calculate the mode EPC for the boundary
     * @param data addresses with lat/lng coordinates
     * @param contextData polygon boundary data
     */
    public createAddressPoints(
        data: BuildingModel[],
        contextData: FeatureCollection<Geometry, GeoJsonProperties>[],
    ): FeatureCollection<Geometry, GeoJsonProperties>[] {
        const coordArray: Feature<Point>[] = [];
        const aggregateData: FeatureCollection<Geometry, GeoJsonProperties>[] = [];
        /** create array of address geojson points */
        data.forEach((p) => {
            if (!p.longitude || !p.latitude) {
                return;
            }

            const pt = point([+p.longitude, +p.latitude], {
                UPRN: p.UPRN,
                TOID: p.TOID ? p.TOID : p.ParentTOID,
                EPC: p.EPC,
            });

            coordArray.push(pt);
        });
        /** create points geojson FeatureCollection */
        const addressPointsFC = featureCollection(coordArray);
        /** Iterate through each layer.  Could be parishes, wards, local authorities */
        contextData.forEach((collection) => {
            let newFeature = {};
            let newCollection: FeatureCollection<Geometry, GeoJsonProperties> | undefined = undefined;
            const featuresWithEPC: Feature<Polygon>[] = [];
            /** iterate through each polygon feature */
            collection.features.map((feature: Feature) => {
                const f = feature as unknown as Polygon;
                /** find address points within polygon */
                const featuresInPolygon = pointsWithinPolygon(addressPointsFC, f);
                /** find the mode EPC for the addresses within the polygon */
                const { aggEPC, epcCounts } = this.calculateEPCMode(featuresInPolygon);
                newFeature = {
                    ...feature,
                    properties: {
                        ...feature.properties!,
                        /** assign the lowest EPC value to the ward */
                        aggEPC: aggEPC.sort((a, b) => b.localeCompare(a, undefined, { sensitivity: 'base' }))[0],
                        ...epcCounts,
                    },
                };
                featuresWithEPC.push(newFeature as Feature<Polygon, GeoJsonProperties>);
            });
            newCollection = {
                ...collection,
                features: featuresWithEPC,
            } as FeatureCollection<Geometry, GeoJsonProperties>;
            aggregateData.push(newCollection);
        });
        return aggregateData;
    }

    /**
     * Calculate the mode EPC value for a set of buildings
     * @param buildings buildings to calculate mode for
     * @returns EPC mode
     */
    private calculateEPCMode(buildings: FeatureCollection<Point | MultiPoint, GeoJsonProperties>): { aggEPC: string[]; epcCounts: { [key: string]: number } } {
        if (!buildings.features.length) {
            return { aggEPC: [], epcCounts: {} };
        }
        const store: { [key: string]: number } = {};
        let maxCount = 0;
        buildings.features.map((b) => {
            if (!store[b.properties!.EPC]) {
                store[b.properties!.EPC] = 0;
            }
            store[b.properties!.EPC] += 1;
            /**
             * Exclude addresses with no EPC from count as it skews results because
             * it includes non-residential addresses
             */
            if (b.properties!.EPC !== 'none' && store[b.properties!.EPC] > maxCount) {
                maxCount = store[b.properties!.EPC];
            }
        });
        const modes = Object.keys(store).filter((key) => store[key] === maxCount);
        return { aggEPC: modes, epcCounts: store };
    }

    /**
     * Create a histogram of EPC counts for a ward
     * @param ratings EPC counts for a ward
     * @returns
     */
    public createHistogram(ratings: Array<{ rating: string; count: number }>): string {
        // wmax value of the histogram array
        const maxValue = Math.max(...ratings.map((o) => o.count));
        const labels: string[] = [];
        const histogram = ratings.map((r) => {
            // getting a percentage of the max
            const height = (r.count / maxValue) * 100;
            const label = `<span>${r.rating === 'none' ? 'No EPC*' : r.rating}</span>`;
            labels.push(label);
            return `
                <div class="histogramItem" style="height: calc(${height}% + 5px)">
                    <span class="epcRating">${r.count}</span>
                    <div class="histogramBar" style="background: ${this.getEPCColour(r.rating)}"></div>
                </div>
            `;
        });

        return `
            <div>
                <div class="histogramWrapper">${histogram.join('')}</div>
                <div class="labelRow">${labels.join('')}</div>
            </div>
        `;
    }

    /**
     * Handle selecting of results card in results list
     * @param TOID
     * @param UPRN
     */
    public resultsCardSelected(TOID: string, UPRN: string): void {
        /** select single dwelling on map */
        if (UPRN !== '' && TOID !== '') {
            this.selectResultsCard(UPRN);
            this.selectSingleDwellingOnMap(TOID);
        }
        /** select multi-dwelling on map */
        if (UPRN === '' && TOID !== '') {
            this.selectMultiDwellingOnMap(TOID);
        }
    }

    /**
     * Handle deselecting results card in results list
     */
    public resultsCardDeselected(): void {
        /**
         * if multi-dwelling don't deselect
         * building on map
         */
        if (this.multiDwelling() !== undefined) {
            this.deselectResultsCard();
            this.closeBuildingDetails();
            this.multiDwelling.set(undefined);
            this.deselectMultiDwellingOnMap();
        } else {
            this.deselectResultsCard();
            this.closeBuildingDetails();
            this.deselectSingleDwellingOnMap();
        }
    }

    /**
     * Handle clicking 'View Details' button
     * @param TOID
     * @param UPRN
     * @param mapCenter
     */
    public viewDetailsButtonClick(TOID: string, UPRN: string, mapCenter: LngLat): void {
        /** if its not viewing details for a multi dwelling select on map */
        if (this.multiDwelling() === undefined) {
            this.selectSingleDwellingOnMap(TOID);
        }
        this.selectResultsCard(UPRN);
        this.viewBuildingDetails(UPRN);
        /** if filtered data also zoom map */
        const filterProps = this.filterProps();
        if (Object.keys(filterProps).length) {
            this.#mapService.zoomToCoords(mapCenter);
        }
    }

    /**
     * Handle 'View Details' close button click
     */
    public closeDetailsButtonClick(): void {
        this.closeBuildingDetails();
        /** if not filtered data or spatial selection also clear map */
        const filterProps = this.filterProps();
        const spatialFilter = this.#spatialQueryService.spatialFilterEnabled();
        if (!spatialFilter && !Object.keys(filterProps).length && this.multiDwelling() === undefined) {
            this.deselectSingleDwellingOnMap();
        }
    }

    /**
     * Handle clicking a single dwelling building on the map
     * @param TOID
     * @param UPRN
     */
    public singleDwellingSelectedOnMap(TOID: string, UPRN: string): void {
        this.selectedUPRN.set(UPRN);
        this.multiDwellingDeselected();
        this.selectSingleDwellingOnMap(TOID);
        this.viewBuildingDetails(UPRN);
        /** if filtered data then results panel open so select card */
        const filterProps = this.filterProps();
        const spatialFilter = this.#spatialQueryService.spatialFilterEnabled();
        if (spatialFilter || Object.keys(filterProps).length) {
            this.selectResultsCard(UPRN);
        }
    }

    /**
     * Handle deselecting a single dwelling building on the map
     */
    public singleDwellingDeselected(): void {
        this.selectedUPRN.set(undefined);
        this.deselectSingleDwellingOnMap();
        this.closeBuildingDetails();
        /** if filtered data then results panel open so deselect card*/
        const spatialFilter = this.#spatialQueryService.spatialFilterEnabled();
        const filterProps = this.filterProps();
        if (spatialFilter || Object.keys(filterProps).length) {
            this.deselectResultsCard();
        }
    }

    /**
     * Handle clicking a multi-dwelling building on the map
     * @param TOID
     */
    public multipleDwellingSelectedOnMap(TOID: string): void {
        this.singleDwellingDeselected();
        this.selectMultiDwellingOnMap(TOID);
    }

    /**
     * Handle deselecting a multi-dwelling building on the map
     */
    public multiDwellingDeselected(): void {
        this.multiDwelling.set(undefined);
        this.deselectMultiDwellingOnMap();
        this.deselectResultsCard();
    }

    public setSpatialFilter(searchArea: GeoJSON.Feature<Polygon>): void {
        this.#dataService.setSelectedUPRN(undefined);
        this.#dataService.setSelectedBuilding(undefined);
        this.#spatialQueryService.setSelectedTOID('');

        /** clear building layer selections */
        this.#spatialQueryService.selectBuilding('', true);
        this.#spatialQueryService.selectBuilding('', false);
        this.#spatialQueryService.setSpatialGeom(searchArea);
    }

    /**
     * Handle deleting spatial filter
     */
    public deleteSpatialFilter(): void {
        this.singleDwellingDeselected();
        this.multiDwellingDeselected();
        this.#spatialQueryService.setSpatialGeom(undefined);
        this.#spatialQueryService.setSpatialFilter(false);
        this.#spatialQueryService.setSpatialFilterBounds(undefined);
        this.#mapService.drawControl?.deleteAll();
        this.#zone.run(() => this.closeResultsPanel());
    }

    /**
     * Handle closing of results panel
     */
    public closeResultsPanel(): void {
        this.#dataService.setSelectedBuildings(undefined);
    }

    /** set the UPRN of the selected results card */
    private selectResultsCard(UPRN: string): void {
        this.selectedCardUPRN.set(UPRN);
    }

    private deselectResultsCard(): void {
        this.selectedCardUPRN.set(undefined);
        this.closeBuildingDetails();
    }

    private viewBuildingDetails(UPRN: string): void {
        this.#dataService.setSelectedUPRN(UPRN);
        const building = this.#dataService.getBuildingByUPRN(UPRN.toString());
        this.#dataService.setSelectedBuilding(building);
    }

    private closeBuildingDetails(): void {
        this.#dataService.setSelectedUPRN(undefined);
        this.#dataService.setSelectedBuilding(undefined);
    }

    private selectSingleDwellingOnMap(TOID: string): void {
        this.#spatialQueryService.setSelectedTOID(TOID);
        /** single dwelling building */
        this.#spatialQueryService.selectBuilding(TOID, false);
        this.#spatialQueryService.selectBuilding('', true);
    }

    private selectMultiDwellingOnMap(TOID: string): void {
        this.multiDwelling.set(TOID);
        this.#spatialQueryService.setSelectedTOID(TOID);
        /** multi-dwelling building */
        this.#spatialQueryService.selectBuilding('', false);
        this.#spatialQueryService.selectBuilding(TOID, true);

        /** only open results panel if there are no filters */
        const filterProps = this.filterProps();
        const spatialFilter = this.#spatialQueryService.spatialFilterEnabled();
        if (!spatialFilter && !Object.keys(filterProps).length) {
            const buildings = this.getBuildings(TOID);
            this.openResultsPanel(buildings);
        }
    }

    private deselectSingleDwellingOnMap(): void {
        this.#spatialQueryService.setSelectedTOID('');
        /** single-dwelling building */
        this.#spatialQueryService.selectBuilding('', false);
    }

    private deselectMultiDwellingOnMap(): void {
        /** if filtered data then results panel open */
        const filterProps = this.filterProps();
        const spatialFilter = this.#spatialQueryService.spatialFilterEnabled();
        if (!spatialFilter && !Object.keys(filterProps).length) {
            this.closeBuildingDetails();
            this.#zone.run(() => this.closeResultsPanel());
        }
        this.#spatialQueryService.setSelectedTOID('');
        /** multi-dwelling building */
        this.#spatialQueryService.selectBuilding('', true);
    }

    private openResultsPanel(buildings: BuildingModel[]): void {
        this.#dataService.setSelectedBuildings([buildings]);
    }

    public getValidFilters(filters: FilterProps): FilterProps {
        const advancedFilterKeys = Object.keys(filters);
        const filterCopy = { ...filters };
        // remove advanced filters without a value
        Object.keys(filterCopy).forEach((key) => {
            const filterKey = key as keyof FilterProps;
            if (filterCopy[filterKey] === null) {
                delete filterCopy[filterKey];
            }
        });

        // identify main filter props
        const mainFilterProps = { ...this.filterProps() };
        Object.keys(mainFilterProps).forEach((key) => {
            const filterKey = key as keyof FilterProps;
            if (advancedFilterKeys.includes(key)) {
                delete mainFilterProps[filterKey];
            }
        });
        // merge filters to create new potential filter
        const newFilter = { ...mainFilterProps, ...filterCopy };

        const unfilteredBuildings = this.#dataService.buildings();

        if (!unfilteredBuildings) {
            return {};
        }

        // filter buildings based on potential filter
        const potentiallyFilteredBuildings = this.filterBuildings(unfilteredBuildings, newFilter);

        // get unique set of valid options for each advanced filter
        const flattenedBuildings = Object.values(potentiallyFilteredBuildings).flat();

        const uniqueOptions = this.getUniqueOptions(advancedFilterKeys, flattenedBuildings);

        // determine which epc expiry options are valid
        const validExpiry: string[] = [];
        const expiredEPCValid = flattenedBuildings.find((b) => this.epcExpired(b.InspectionDate));
        const inDateEPCValid = flattenedBuildings.find((b) => this.epcInDate(b.InspectionDate));
        if (expiredEPCValid) {
            validExpiry.push('EPC Expired');
        }
        if (inDateEPCValid) {
            validExpiry.push('EPC In Date');
        }

        return { ...uniqueOptions, EPCExpiry: validExpiry };
    }

    public getAllUniqueFilterOptions(filters: FilterProps): FilterProps {
        const unfilteredBuildings = this.#dataService.buildings();

        if (!unfilteredBuildings) {
            return {};
        }

        const flattenedBuildings = Object.values(unfilteredBuildings).flat();
        const filterKeys = Object.keys(filters);
        // Do not fetch EPC Expiry values from data as these are static
        if (filterKeys.includes('EPCExpiry')) {
            filterKeys.splice(filterKeys.indexOf('EPCExpiry'), 1);
        }
        const options = this.getUniqueOptions(filterKeys, flattenedBuildings);
        return options;
    }

    public getUniqueOptions(filterKeys: string[], flattenedBuildings: BuildingModel[]): FilterProps {
        const availableValues: FilterProps = {};
        filterKeys.forEach((key) => {
            const keyProp = key as keyof BuildingModel;
            const options = [...new Set(flattenedBuildings.map((b) => b[keyProp] ?? ''))].sort((a, b) =>
                a.localeCompare(b, undefined, { sensitivity: 'base' }),
            );

            if (options.includes('NoData')) {
                options.push(options.splice(options.indexOf('NoData'), 1)[0]);
            }

            if (options.includes('')) {
                options.splice(options.indexOf(''), 1);
            }

            availableValues[key as keyof FilterProps] = options;
        });
        return availableValues;
    }
}
