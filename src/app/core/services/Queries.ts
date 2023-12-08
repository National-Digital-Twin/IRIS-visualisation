import { LngLatBounds } from 'mapbox-gl';

export class Queries {
  getBuildingDetails(uprn: string) {
    return `
    PREFIX data: <http://nationaldigitaltwin.gov.uk/data#>
    PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
    PREFIX qudt: <http://qudt.org/2.1/schema/qudt/>
    PREFIX ndt: <http://nationaldigitaltwin.gov.uk/ontology#>
    PREFIX iesuncertainty: <http://ies.data.gov.uk/ontology/ies_uncertainty_proposal/v2.0#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

  SELECT
      ?building
      (GROUP_CONCAT(DISTINCT REPLACE(STR(?building_type), "http://nationaldigitaltwin.gov.uk/ontology#", ""); SEPARATOR="; ") AS ?building_types)
      ?inspection_date_literal
      (REPLACE(STR(?epc_rating), "http://gov.uk/government/organisations/department-for-levelling-up-housing-and-communities/ontology/epc#BuildingWithEnergyRatingOf", "") AS ?epc)
      #?sap_points
      ?counterpart
      ?line_of_address_literal
      (GROUP_CONCAT(DISTINCT ?part; SEPARATOR="; ") AS ?parts)
  WHERE {{
      ?building ies:isIdentifiedBy ?uprn .
      ?uprn ies:representationValue "${uprn}" .

      ?building rdf:type ?building_type.

      ?building ies:inLocation ?address .

      ?address ies:isIdentifiedBy ?line_of_address .
      ?line_of_address rdf:type ies:FirstLineOfAddress .
      ?line_of_address ies:representationValue ?line_of_address_literal .

      ?state ies:inPeriod ?inspection_date .
      ?state ies:isStateOf ?building .
      ?inspection_date ies:iso8601PeriodRepresentation ?inspection_date_literal .

      ?part ies:isPartOf ?state .

      ?state a ?epc_rating .

      #?state ies:hasCharacteristic ?quantity .
      #?quantity qudt:value ?sap_points .

      OPTIONAL {{
          ?building ndt:actualCounterpartElement ?counterpartset .
          ?counterpart iesuncertainty:counterpartElement ?counterpartset .
      }}
  }}
  GROUP BY
      ?building
      ?inspection_date_literal
      ?epc_rating
      #?sap_points
      ?counterpart
      ?line_of_address_literal
  `;
  }

  getBuildingListDetails(uprns: string[]) {
    return `
    PREFIX data: <http://nationaldigitaltwin.gov.uk/data#>
    PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
    PREFIX qudt: <http://qudt.org/2.1/schema/qudt/>
    PREFIX ndt: <http://nationaldigitaltwin.gov.uk/ontology#>
    PREFIX iesuncertainty: <http://ies.data.gov.uk/ontology/ies_uncertainty_proposal/v2.0#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT
        ?building
        (GROUP_CONCAT(DISTINCT REPLACE(STR(?building_type), "http://nationaldigitaltwin.gov.uk/ontology#", ""); SEPARATOR="; ") AS ?building_types)
        (REPLACE(STR(?epc_rating), "http://gov.uk/government/organisations/department-for-levelling-up-housing-and-communities/ontology/epc#BuildingWithEnergyRatingOf", "") AS ?epc)
        ?line_of_address_literal
    WHERE {
        ?building ies:isIdentifiedBy ?uprn .

        ?uprn ies:representationValue ?uprnValue .
        VALUES ?uprnValue {"${uprns.join('" "')}"} .

        ?building rdf:type ?building_type.
        ?building ies:inLocation ?address .

        ?address ies:isIdentifiedBy ?line_of_address .
        ?line_of_address rdf:type ies:FirstLineOfAddress .
        ?line_of_address ies:representationValue ?line_of_address_literal .

        ?state ies:isStateOf ?building .

        ?state a ?epc_rating .
    }
    GROUP BY
        ?building
        ?epc_rating
        ?line_of_address_literal
    `;
  }

  getEPCWithinBounds(bounds: LngLatBounds) {
    // _sw.lat <= building.lat && building.lat <= _ne.lat && _sw.lng <= building.lng && building.lng <= _ne.lng
    const { _ne, _sw } = bounds;
    return `
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    SELECT ?uprn_id ?current_energy_rating (GROUP_CONCAT(DISTINCT ?type; SEPARATOR="; ") AS ?types)
    WHERE {
      ?building a ?type .
      ?building ies:isIdentifiedBy/ies:representationValue ?uprn_id .
      ?building ies:inLocation ?geopoint .

      ?state ies:isStateOf ?building .
      ?state a ?current_energy_rating .

      ?geopoint rdf:type ies:GeoPoint .
      ?geopoint ies:isIdentifiedBy ?lat .
      ?lat rdf:type ies:Latitude .
      ?lat ies:representationValue ?lat_literal .
      ?geopoint ies:isIdentifiedBy ?lon .
      ?lon rdf:type ies:Longitude .
      ?lon ies:representationValue ?lon_literal .

      FILTER (${_sw.lat} <= xsd:float(?lat_literal) && xsd:float(?lat_literal) <= ${_ne.lat} && ${_sw.lng} <= xsd:float(?lon_literal) && xsd:float(?lon_literal) <= ${_ne.lng}) .
    }
    GROUP BY
      ?uprn_id
      ?current_energy_rating
    `;
  }

  getBuildingTypes() {
    return `
      PREFIX data: <http://nationaldigitaltwin.gov.uk/data#>
      PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
      PREFIX epc: <http://gov.uk/government/organisations/department-for-levelling-up-housing-and-communities/ontology/epc#>
      PREFIX building: <http://nationaldigitaltwin.gov.uk/ontology#>

      SELECT DISTINCT ?building_type
      WHERE {
        ?building a ?building_type .
          FILTER(isUri(?building_type) && STRSTARTS(STR(?building_type), STR(building:)))
      }
    `;
  }

  getEPCs() {
    return `
      PREFIX data: <http://nationaldigitaltwin.gov.uk/data#>
      PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
      PREFIX epc: <http://gov.uk/government/organisations/department-for-levelling-up-housing-and-communities/ontology/epc#>

      SELECT DISTINCT ?epc
      WHERE {
        ?state a ?epc .
          FILTER(isUri(?epc) && STRSTARTS(STR(?epc), STR(epc:)))
      }
    `;
  }

  getAllData() {
    return `
    PREFIX data: <http://nationaldigitaltwin.gov.uk/data#>
    PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
    PREFIX qudt: <http://qudt.org/2.1/schema/qudt/>
    PREFIX ndt: <http://nationaldigitaltwin.gov.uk/ontology#>
    PREFIX iesuncertainty: <http://ies.data.gov.uk/ontology/ies_uncertainty_proposal/v2.0#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT
        ?uprn_id
        (GROUP_CONCAT(DISTINCT REPLACE(STR(?building_type), "http://nationaldigitaltwin.gov.uk/ontology#", ""); SEPARATOR="; ") AS ?building_types)
        (REPLACE(STR(?epc_rating), "http://gov.uk/government/organisations/department-for-levelling-up-housing-and-communities/ontology/epc#BuildingWithEnergyRatingOf", "") AS ?epc)
        ?line_of_address_literal
    WHERE {
        ?building ies:isIdentifiedBy/ies:representationValue ?uprn_id .
        ?building rdf:type ?building_type.
        ?building ies:inLocation ?address .
        ?address ies:isIdentifiedBy ?line_of_address .
        ?line_of_address rdf:type ies:FirstLineOfAddress .
        ?line_of_address ies:representationValue ?line_of_address_literal .
        ?state ies:isStateOf ?building .
        ?state a ?epc_rating .
    }
    GROUP BY
        ?uprn_id
        ?building
        ?epc_rating
        ?line_of_address_literal
    `;
  }
}
