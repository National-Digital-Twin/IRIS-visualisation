export interface NamesSearchData {
  ID: string;
  NAMES_URI: string;
  NAME1: string;
  TYPE: string;
  LOCAL_TYPE: string;
  GEOMETRY_X: number;
  GEOMETRY_Y: number;
  MOST_DETAIL_VIEW_RES: number;
  LEAST_DETAIL_VIEW_RES: number;
  POPULATED_PLACE: string;
  POPULATED_PLACE_URI: string;
  POPULATED_PLACE_TYPE: number;
  COUNTY_UNITARY: string;
  COUNTY_UNITARY_URI: string;
  COUNTY_UNITARY_TYPE: string;
  REGION: string;
  REGION_URI: string;
  COUNTRY: string;
  COUNTRY_URI: string;
}

export interface OSNamesSearchResults {
  GAZETTEER_ENTRY: NamesSearchData;
}

export interface OSNamesSearchResponse {
  header: {
    uri: string;
    query: string;
    offset: number;
    totalresults: number;
    format: string;
    maxresults: number;
  };
  results: OSNamesSearchResults[];
}
