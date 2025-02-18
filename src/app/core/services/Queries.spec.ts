import { Queries } from './Queries';

describe('Queries', () => {
  let queries: Queries;

  beforeEach(() => {
    queries = new Queries();
  });

  describe('getNoEPCBuildingDetails', () => {
    it('should include the given UPRN and necessary prefixes in the query string', () => {
      const uprn = '12345';
      const queryString = queries.getNoEPCBuildingDetails(uprn);
      expect(queryString).toContain('PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>');
      expect(queryString).toContain('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>');
      expect(queryString).toContain('SELECT');
      expect(queryString).toContain(`?uprn ies:representationValue "${uprn}"`);
    });
  });

  describe('getEPCData', () => {
    it('should return a valid EPC data query', () => {
      const queryString = queries.getEPCData();
      expect(queryString).toContain('PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>');
      expect(queryString).toContain('PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>');
      expect(queryString).toContain('PREFIX ndt: <http://nationaldigitaltwin.gov.uk/ontology#>');
      expect(queryString).toContain('SELECT');
      expect(queryString).toContain('GROUP BY');
    });
  });

  describe('getNoEPCData', () => {
    it('should return a query string that filters out EPC states', () => {
      const queryString = queries.getNoEPCData();
      expect(queryString).toContain('FILTER NOT EXISTS { ?epc_state ies:isStateOf ?building . }');
      expect(queryString).toContain('PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>');
      expect(queryString).toContain('SELECT');
    });
  });

  describe('getFlagHistory', () => {
    it('should include the provided UPRN in the flag history query', () => {
      const uprn = '67890';
      const queryString = queries.getFlagHistory(uprn);
      expect(queryString).toContain('PREFIX data: <http://nationaldigitaltwin.gov.uk/data#>');
      expect(queryString).toContain('PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>');
      expect(queryString).toContain('SELECT');
      expect(queryString).toContain(`?uprn ies:representationValue "${uprn}"`);
    });
  });

  describe('getSAPPoints', () => {
    it('should return a query string containing SAP points and expected prefixes', () => {
      const queryString = queries.getSAPPoints();
      expect(queryString).toContain('PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>');
      expect(queryString).toContain('PREFIX ndt: <http://nationaldigitaltwin.gov.uk/ontology#>');
      expect(queryString).toContain('SELECT');
      expect(queryString).toContain('(?sap_points AS ?SAPPoint)');
    });
  });

  describe('getAllFlaggedBuildings', () => {
    it('should return a query string for all flagged buildings with correct clauses', () => {
      const queryString = queries.getAllFlaggedBuildings();
      expect(queryString).toContain('PREFIX data: <http://nationaldigitaltwin.gov.uk/data#>');
      expect(queryString).toContain('PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>');
      expect(queryString).toContain('SELECT');
      expect(queryString).toContain('GROUP BY');
    });
  });
});
