import { TestBed } from '@angular/core/testing';
import { DataService } from './data.service';
import { HttpClient } from '@angular/common/http';
import { of, EMPTY } from 'rxjs';
import { EPC_DATA_FILE_NAME, NON_EPC_DATA_FILE_NAME, SAP_DATA_FILE_NAME } from '@core/tokens/cache.token';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { SEARCH_ENDPOINT } from '@core/tokens/search-endpoint.token';
import { WRITE_BACK_ENDPOINT } from '@core/tokens/write-back-endpoint.token';

// Increase default timeout for long-running tests.
jest.setTimeout(10000);

const dummySearchEndpoint = 'http://search-endpoint';
const dummyWriteBackEndpoint = 'http://write-back-endpoint';
const dummyRuntimeConfig = {
  contextLayers: [{ filename: 'layer1.json' }, { filename: 'layer2.json' }],
};

describe('DataService', () => {
  let service: DataService;
  let httpClientSpy: { get: jest.Mock; post: jest.Mock };

  beforeEach(() => {
    httpClientSpy = {
      get: jest.fn(),
      post: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        DataService,
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: SEARCH_ENDPOINT, useValue: dummySearchEndpoint },
        { provide: WRITE_BACK_ENDPOINT, useValue: dummyWriteBackEndpoint },
        { provide: RUNTIME_CONFIGURATION, useValue: dummyRuntimeConfig },
        { provide: EPC_DATA_FILE_NAME, useValue: 'epc-cache-url' },
        { provide: NON_EPC_DATA_FILE_NAME, useValue: 'non-epc-cache-url' },
        { provide: SAP_DATA_FILE_NAME, useValue: 'sap-cache-url' },
      ],
    });
    service = TestBed.inject(DataService);
  });

  // --- Test buildTable ---
  describe('buildTable', () => {
    it('should build table rows from a SPARQLReturn', () => {
      const dummySparqlReturn = {
        head: { vars: ['col1', 'col2'] },
        results: {
          bindings: [
            { col1: { value: 'a' }, col2: { value: 'b' } },
            { col1: { value: 'c' }, col2: { value: 'd' } },
          ],
        },
      };
      const table = (service as any).buildTable(dummySparqlReturn);
      expect(table).toEqual([
        { col1: 'a', col2: 'b' },
        { col1: 'c', col2: 'd' },
      ]);
    });
  });

  // --- Test mapBuildings ---
  describe('mapBuildings', () => {
    it('should group buildings by TOID (or ParentTOID) and assign EPC none if undefined', () => {
      const buildings = [
        { UPRN: '1', TOID: 'T1', EPC: undefined, FullAddress: 'Addr1' },
        { UPRN: '2', ParentTOID: 'T2', EPC: 'A', FullAddress: 'Addr2' },
        { UPRN: '3', TOID: 'T1', EPC: 'B', FullAddress: 'Addr3' },
      ];
      const buildingMap = service.mapBuildings(buildings as any);
      expect(buildingMap).toEqual({
        T1: [
          { UPRN: '1', TOID: 'T1', EPC: 'none', FullAddress: 'Addr1' },
          { UPRN: '3', TOID: 'T1', EPC: 'B', FullAddress: 'Addr3' },
        ],
        T2: [{ UPRN: '2', ParentTOID: 'T2', EPC: 'A', FullAddress: 'Addr2' }],
      });
    });
  });

  // --- Test getBuildingByUPRN ---
  describe('getBuildingByUPRN', () => {
    it('should return the building matching the given UPRN', () => {
      const dummyMap = {
        T1: [
          { UPRN: '1', TOID: 'T1', EPC: 'A', FullAddress: 'Addr1' },
          { UPRN: '2', TOID: 'T1', EPC: 'B', FullAddress: 'Addr2' },
        ],
      };
      Object.defineProperty(service, 'buildingData', {
        get: () => () => dummyMap,
        configurable: true,
      });
      const building = service.getBuildingByUPRN('2');
      expect(building).toEqual({ UPRN: '2', TOID: 'T1', EPC: 'B', FullAddress: 'Addr2' });
    });
  });  

  // --- Test selectTable ---
  describe('selectTable', () => {
    it('should call HttpClient.get with the proper URL and transform the response', (done) => {
      const dummySparqlReturn = {
        head: { vars: ['col1'] },
        results: { bindings: [{ col1: { value: 'val1' } }] },
      };
      httpClientSpy.get.mockReturnValueOnce(of(dummySparqlReturn));
      (service as any).selectTable('dummy query').subscribe((table: any) => {
        expect(table).toEqual([{ col1: 'val1' }]);
        done();
      });
    });
  });

  // --- Test loadContextData ---
  describe('loadContextData', () => {
    it('should load context data from asset files', (done) => {
      const dummyFeatureCollection1 = { type: 'FeatureCollection', features: [] };
      const dummyFeatureCollection2 = { type: 'FeatureCollection', features: [] };
      httpClientSpy.get
        .mockReturnValueOnce(of(dummyFeatureCollection1))
        .mockReturnValueOnce(of(dummyFeatureCollection2));
      (service as any).loadContextData().subscribe((data: any) => {
        expect(data).toEqual([dummyFeatureCollection1, dummyFeatureCollection2]);
        done();
      });
    });
  });

  // --- Test flagToInvestigate ---
  describe('flagToInvestigate', () => {
    it('should post to flag a building and update flagged signals if selected building matches', (done) => {
      const dummyBuilding = { UPRN: '1', TOID: 'T1', ParentTOID: null, FullAddress: 'Addr1' } as any;
      service.setSelectedBuilding(dummyBuilding);
      httpClientSpy.post.mockReturnValueOnce(of('flagUri1'));

      const dummyFlagHistoryResponse = {
        head: { vars: ['Flagged', 'AssessmentReason', 'FlagDate'] },
        results: {
          bindings: [
            {
              Flagged: { value: 'flag1' },
              AssessmentReason: { value: 'reason1' },
              FlagDate: { value: '2020-01-01T00:00:00Z' },
            },
            {
              Flagged: { value: 'flag2' },
              FlagDate: { value: '2020-01-02T00:00:00Z' },
            },
          ],
        },
      };
      httpClientSpy.get.mockReturnValueOnce(of(dummyFlagHistoryResponse));

      service.flagToInvestigate(dummyBuilding).subscribe(() => {
        expect(dummyBuilding.Flagged).toBe('flagUri1');
        const flaggedMap = (service as any).buildingsFlagged();
        expect(flaggedMap['T1'][0]).toEqual(
          expect.objectContaining({ UPRN: '1', Flagged: 'flagUri1' })
        );
        done();
      });
    });
  });

  // --- Test invalidateFlag ---
  describe('invalidateFlag', () => {
    it('should post to invalidate a flag and update flagged signals if selected building matches', (done) => {
      const dummyBuilding = {
        UPRN: '1',
        TOID: 'T1',
        ParentTOID: null,
        FullAddress: 'Addr1',
        Flagged: 'flagUri1',
      } as any;
      service.setSelectedBuilding(dummyBuilding);
      httpClientSpy.post.mockReturnValueOnce(of('ignored'));
      const dummyFlagHistoryResponse = {
        head: { vars: ['Flagged', 'AssessmentReason', 'FlagDate'] },
        results: { bindings: [] },
      };
      httpClientSpy.get.mockReturnValueOnce(of(dummyFlagHistoryResponse));

      (service as any).buildingsFlagged.set({ T1: [{ UPRN: '1', Flagged: 'flagUri1' }] });
      service.invalidateFlag(dummyBuilding, 'reason1' as any).subscribe(() => {
        expect(dummyBuilding.Flagged).toBeUndefined();
        const flaggedMap = (service as any).buildingsFlagged();
        expect(flaggedMap['T1']).toEqual([]);
        done();
      });
    });
  });

  describe('updateFlagHistory', () => {
    it('should update flagHistory and activeFlag signals based on flag history response', (done) => {
      const dummySparqlReturn = {
        head: { vars: ['Flagged', 'AssessmentReason', 'FlagDate'] },
        results: {
          bindings: [
            {
              Flagged: { value: 'flag1' },
              AssessmentReason: { value: 'reason1' },
              FlagDate: { value: '2020-01-01T00:00:00Z' },
            },
            {
              Flagged: { value: 'flag2' },
              FlagDate: { value: '2020-01-02T00:00:00Z' },
            },
          ],
        },
      };
      httpClientSpy.get.mockReturnValueOnce(of(dummySparqlReturn));
      service.updateFlagHistory('1').subscribe(() => {
        expect(service.flagHistory()).toEqual([
          { Flagged: 'flag1', AssessmentReason: 'reason1', FlagDate: '2020-01-01T00:00:00Z' },
        ]);
        expect(service.activeFlag()).toEqual({
          Flagged: 'flag2',
          FlagDate: '2020-01-02T00:00:00Z',
          AssessmentReason: "",
        });
        done();
      });
    });
  });
  

  // --- Test combineBuildingData ---
  describe('combineBuildingData', () => {
    it('should merge EPC and non-EPC building maps and update flagged properties', () => {
      const epcBuildings = {
        T1: [{ UPRN: '1', TOID: 'T1', EPC: 'A', FullAddress: 'Addr1' }],
      };
      const nonEPCBuildings = {
        T1: [{ UPRN: '2', TOID: 'T1', EPC: undefined, FullAddress: 'Addr2' }],
      };
      const flaggedBuildings = { T1: [{ UPRN: '1', Flagged: 'flag1' }] };
      const combined = (service as any).combineBuildingData(epcBuildings, nonEPCBuildings, flaggedBuildings);
      expect(combined['T1'].length).toBe(2);
      const building1 = combined['T1'].find((b: any) => b.UPRN === '1');
      expect(building1.Flagged).toBe('flag1');
    });
  });

  // --- Test mapSAPPointsToToids ---
  describe('mapSAPPointsToToids', () => {
    it('should group SAP points by TOID', () => {
      const sapPoints = [
        { UPRN: '1', TOID: 'T1', SAPPoint: 100, latitude: '5', longitude: '5' },
        { UPRN: '2', ParentTOID: 'T2', SAPPoint: 200, latitude: '6', longitude: '6' },
      ];
      const mapResult = (service as any).mapSAPPointsToToids(sapPoints);
      expect(mapResult).toEqual({
        T1: [{ UPRN: '1', TOID: 'T1', SAPPoint: 100, latitude: '5', longitude: '5' }],
        T2: [{ UPRN: '2', ParentTOID: 'T2', SAPPoint: 200, latitude: '6', longitude: '6' }],
      });
    });
  });

  describe('DataService Additional Coverage', () => {
    // --- Test setSelectedUPRN ---
    describe('setSelectedUPRN', () => {
      it('should update selectedUPRN signal', () => {
        service.setSelectedUPRN('test-uprn');
        expect(service.selectedUPRN()).toBe('test-uprn');
      });
    });

    // --- Test setSelectedBuilding ---
    describe('setSelectedBuilding', () => {
      it('should update selectedBuilding signal', () => {
        const building = { UPRN: '1', TOID: 'T1', FullAddress: 'Addr1' } as any;
        service.setSelectedBuilding(building);
        expect(service.selectedBuilding()).toEqual(building);
      });
    });

    // --- Test setSelectedBuildings ---
    describe('setSelectedBuildings', () => {
      it('should update buildingsSelection signal', () => {
        const buildings = [[{ UPRN: '1', TOID: 'T1', FullAddress: 'Addr1' } as any]];
        service.setSelectedBuildings(buildings);
        expect(service.buildingsSelection()).toEqual(buildings);
      });
    });

    // --- Test mapEPCBuildings ---
    describe('mapEPCBuildings', () => {
      it('should map EPC buildings correctly using SAP points and parsed building parts', () => {
        const dummyEPCBuilding = {
          UPRN: '1',
          TOID: 'T1',
          ParentTOID: null,
          FullAddress: 'Addr1',
          PostCode: '12345',
          PropertyType: 'House',
          BuildForm: 'Detached',
          InspectionDate: '2020-01-01T00:00:00Z',
          EPC: 'A',
          PartTypes: 'Wall',
          InsulationTypes: 'InsWall',
          InsulationThickness: 'NoData',
          InsulationThicknessLowerBound: 'NoData',
        };
        const dummySAPPointMap = {
          T1: [{ UPRN: '1', SAPPoint: 100, latitude: '5', longitude: '5' }],
        };
        const mapped = (service as any).mapEPCBuildings([dummyEPCBuilding], dummySAPPointMap);
        expect(mapped).toEqual({
          T1: [
            {
              UPRN: '1',
              TOID: 'T1',
              ParentTOID: null,
              FullAddress: 'Addr1',
              PostCode: '12345',
              PropertyType: 'House',
              BuildForm: 'Detached',
              InspectionDate: '2020-01-01T00:00:00Z',
              YearOfAssessment: '2020',
              EPC: 'A',
              SAPPoints: 100,
              FloorConstruction: 'NoData',
              FloorInsulation: 'NoData',
              RoofConstruction: 'NoData',
              RoofInsulationLocation: 'NoData',
              RoofInsulationThickness: 'NoData',
              WallConstruction: 'Wall',
              WallInsulation: 'InsWall',
              WindowGlazing: 'NoData',
              Flagged: undefined,
              latitude: '5',
              longitude: '5',
            },
          ],
        });
      });
    });

    // --- Test mapNonEPCBuildings ---
    describe('mapNonEPCBuildings', () => {
      it('should map non-EPC buildings correctly', () => {
        const dummyNoEPC = {
          UPRN: '2',
          TOID: 'T2',
          ParentTOID: null,
          FullAddress: 'Addr2',
          PostCode: '54321',
        };
        const mapped = (service as any).mapNonEPCBuildings([dummyNoEPC]);
        expect(mapped).toEqual({
          T2: [
            {
              ...dummyNoEPC,
              BuildForm: undefined,
              EPC: 'none', // assuming EPCRating.none equals "none"
              FloorConstruction: undefined,
              FloorInsulation: undefined,
              InspectionDate: undefined,
              PropertyType: undefined,
              RoofConstruction: undefined,
              RoofInsulationLocation: undefined,
              RoofInsulationThickness: undefined,
              SAPPoints: undefined,
              WallConstruction: undefined,
              WallInsulation: undefined,
              WindowGlazing: undefined,
              YearOfAssessment: undefined,
            },
          ],
        });
      });
    });

    describe('parseBuildingParts', () => {
      it('should parse building parts correctly', () => {
        (service as any).isWindowKey = (value: string) => value === "Window";
    
        const dummyRow = {
          PartTypes: "Wall;Floor;Roof;Window",
          InsulationTypes: "InsWall;InsFloor;InsRoof;InsWindow",
          InsulationThickness: "NoData;10.0;NoData;NoData",
          InsulationThicknessLowerBound: "NoData;NoData;20.0;NoData",
        };
        const parts = (service as any).parseBuildingParts(dummyRow);
        expect(parts).toEqual({
          FloorConstruction: "Floor",
          FloorInsulation: "InsFloor",
          RoofConstruction: "Roof",
          RoofInsulationLocation: "InsRoof",
          RoofInsulationThickness: "20+mm",
          WallConstruction: "Wall",
          WallInsulation: "InsWall",
          WindowGlazing: "Window",
        });
      });
    });    

    // --- Test getCurrentFlags ---
    describe('getCurrentFlags', () => {
      it('should return the most current unique flag for each UPRN', () => {
        const flags = [
          { UPRN: '1', FlagDate: '2020-01-01T00:00:00Z', Flagged: 'f1', ParentTOID: 'T1', TOID: 'T1' },
          { UPRN: '1', FlagDate: '2020-01-02T00:00:00Z', Flagged: 'f2', ParentTOID: 'T1', TOID: 'T1' },
          { UPRN: '2', FlagDate: '2020-01-01T00:00:00Z', Flagged: 'f3', ParentTOID: 'T2', TOID: 'T2' },
        ];
        const currentFlags = (service as any).getCurrentFlags(flags);
        expect(currentFlags).toEqual([
          { UPRN: '1', FlagDate: '2020-01-02T00:00:00Z', Flagged: 'f2', ParentTOID: 'T1', TOID: 'T1' },
          { UPRN: '2', FlagDate: '2020-01-01T00:00:00Z', Flagged: 'f3', ParentTOID: 'T2', TOID: 'T2' },
        ]);
      });
    });

    // --- Test mapFlagsToToids ---
    describe('mapFlagsToToids', () => {
      it('should group flags by TOID (using TOID if present, otherwise ParentTOID)', () => {
        const flags = [
          { UPRN: '1', FlagDate: '2020-01-01T00:00:00Z', Flagged: 'f1', ParentTOID: null, TOID: 'T1' },
          { UPRN: '2', FlagDate: '2020-01-01T00:00:00Z', Flagged: 'f2', ParentTOID: 'T2', TOID: null },
        ];
        const flagMap = (service as any).mapFlagsToToids(flags);
        expect(flagMap).toEqual({
          T1: [flags[0]],
          T2: [flags[1]],
        });
      });
    });
  });
});
