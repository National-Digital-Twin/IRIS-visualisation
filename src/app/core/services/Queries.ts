import { LngLatBounds } from 'mapbox-gl';

export class Queries {
  getBuildingDetails(uprn: number) {
    return `
    PREFIX data: <http://nationaldigitaltwin.gov.uk/data#>
    PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
    PREFIX qudt: <http://qudt.org/2.1/schema/qudt/>
    PREFIX ndt: <http://nationaldigitaltwin.gov.uk/ontology#>
    PREFIX iesuncertainty: <http://ies.data.gov.uk/ontology/ies_uncertainty_proposal/v2.0#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX geoplace: <https://www.geoplace.co.uk/addresses-streets/location-data/the-uprn#>

    SELECT
        (REPLACE(STR(?uprn), "http://nationaldigitaltwin.gov.uk/data#uprn_", "") as ?UPRN)
        (REPLACE(STR(?property_type), "http://nationaldigitaltwin.gov.uk/ontology#", "") AS ?PropertyType)
        (REPLACE(STR(?build_form_type), "http://nationaldigitaltwin.gov.uk/ontology#", "") AS ?BuildForm)
        (?inspection_date_literal AS ?InspectionDate)
        (REPLACE(STR(?epc_rating), "http://gov.uk/government/organisations/department-for-levelling-up-housing-and-communities/ontology/epc#BuildingWithEnergyRatingOf", "") AS ?EPC)
        (?line_of_address_literal AS ?FullAddress)
        (SUBSTR(?postcode_literal, 0, 5) AS ?PostCode)
        (?sap_points AS ?SAPPoints)
        (GROUP_CONCAT(DISTINCT ?part; SEPARATOR="; ") AS ?parts)
    WHERE {{
        ?building ies:isIdentifiedBy ?uprn .
        ?uprn ies:representationValue "${uprn}" .
        ?building rdf:type ?property_type .
        ?property_type ies:powertype ndt:PropertyClass .
        OPTIONAL {
        ?building rdf:type ?build_form_type .
        ?build_form_type ies:powertype ndt:BuildFormClass .
        }

        ?building ies:inLocation ?address .

        ?address ies:isIdentifiedBy ?postcode .
        ?postcode rdf:type ies:PostalCode .
        ?postcode ies:representationValue ?postcode_literal .

        ?address ies:isIdentifiedBy ?line_of_address .
        ?line_of_address rdf:type ies:FirstLineOfAddress .
        ?line_of_address ies:representationValue ?line_of_address_literal .

        ?state ies:isStateOf ?building .
        ?state ies:inPeriod ?inspection_date .
        ?inspection_date ies:iso8601PeriodRepresentation ?inspection_date_literal .

        ?state a ?epc_rating .
        OPTIONAL {{
            ?part ies:isPartOf ?state .
        }}

        ?state ies:hasCharacteristic ?quantity .
        ?quantity qudt:value ?sap_points .
    }}
    GROUP BY
        ?uprn
        ?property_type
        ?build_form_type
        ?postcode_literal
        ?building
        ?inspection_date_literal
        ?epc_rating
        ?sap_points
        ?line_of_address_literal
        ?building_toid_id
        ?parent_building_toid_id
  `;
  }

  getBuildingListDetails(uprns: number[]) {
    return `
    PREFIX data: <http://nationaldigitaltwin.gov.uk/data#>
    PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
    PREFIX qudt: <http://qudt.org/2.1/schema/qudt/>
    PREFIX ndt: <http://nationaldigitaltwin.gov.uk/ontology#>
    PREFIX iesuncertainty: <http://ies.data.gov.uk/ontology/ies_uncertainty_proposal/v2.0#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX geoplace: <https://www.geoplace.co.uk/addresses-streets/location-data/the-uprn#>

    SELECT
      (?uprnValue AS ?UPRN)
      (?building_toid_id AS ?TOID)
      (?parent_building_toid_id AS ?ParentTOID)
      (REPLACE(STR(?property_type), "http://nationaldigitaltwin.gov.uk/ontology#", "") AS ?PropertyType)
      (REPLACE(STR(?epc_rating), "http://gov.uk/government/organisations/department-for-levelling-up-housing-and-communities/ontology/epc#BuildingWithEnergyRatingOf", "") AS ?EPC)
      (?line_of_address_literal AS ?FullAddress)
    WHERE {{
        ?building ies:isIdentifiedBy ?uprn .
        ?uprn ies:representationValue ?uprnValue .
        VALUES ?uprnValue {"${uprns.join('" "')}"} .
        ?building rdf:type ?property_type .
        ?property_type ies:powertype ndt:PropertyClass .

        ?building ies:inLocation ?address .

        ?address ies:isIdentifiedBy ?line_of_address .
        ?line_of_address rdf:type ies:FirstLineOfAddress .
        ?line_of_address ies:representationValue ?line_of_address_literal .

        ?state ies:isStateOf ?building .

        ?state a ?epc_rating .

        OPTIONAL {{
            ?building ies:isIdentifiedBy ?building_toid .
            ?building_toid rdf:type ies:TOID .
            ?building_toid ies:representationValue ?building_toid_id .
        }}
        OPTIONAL {{
            ?building ies:isPartOf ?parent_building .
            ?parent_building ies:isIdentifiedBy ?parent_building_toid .
            ?parent_building_toid ies:representationValue ?parent_building_toid_id .
            ?parent_building_toid rdf:type ies:TOID .
        }}
    }}
    GROUP BY
      ?uprnValue
      ?building
      ?epc_rating
      ?line_of_address_literal
      ?building_toid_id
      ?parent_building_toid_id
      ?property_type
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

  getAllData() {
    return `
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX geoplace: <https://www.geoplace.co.uk/addresses-streets/location-data/the-uprn#>
    SELECT
        (?uprn_id AS ?uprnId)
        (?building_toid_id AS ?toid)
        (?parent_building_toid_id AS ?parentToid)
        (REPLACE(STR(?current_energy_rating), "http://gov.uk/government/organisations/department-for-levelling-up-housing-and-communities/ontology/epc#BuildingWithEnergyRatingOf", "") AS ?epc)
        (GROUP_CONCAT(DISTINCT REPLACE(STR(?building_type), "http://nationaldigitaltwin.gov.uk/ontology#", ""); SEPARATOR="; ") AS ?building_types)
        (?line_of_address_literal AS ?fullAddress)
    WHERE {
        ?building ies:inLocation ?address .

        ?state ies:isStateOf ?building .
        ?state a ?current_energy_rating .

        ?building ies:isIdentifiedBy ?uprn .
        ?uprn ies:representationValue ?uprn_id .
        ?uprn rdf:type geoplace:UniquePropertyReferenceNumber .

        ?building a ?building_type .

        ?address ies:isIdentifiedBy ?line_of_address .
        ?line_of_address rdf:type ies:FirstLineOfAddress .
        ?line_of_address ies:representationValue ?line_of_address_literal .

        OPTIONAL {
            ?building ies:isIdentifiedBy ?building_toid .
            ?building_toid rdf:type ies:TOID .
            ?building_toid ies:representationValue ?building_toid_id .
        }
        OPTIONAL {
            ?building ies:isPartOf ?parent_building .
            ?parent_building ies:isIdentifiedBy ?parent_building_toid .
            ?parent_building_toid ies:representationValue ?parent_building_toid_id .
            ?parent_building_toid rdf:type ies:TOID .
        }

    }
    GROUP BY
        ?uprn_id
        ?building_toid_id
        ?parent_building_toid_id
        ?current_energy_rating
        ?line_of_address_literal
    `;
  }

  getBuildingParts(partURIs: string[]) {
    const parts = partURIs
      .map(p =>
        p.trim().replace('http://nationaldigitaltwin.gov.uk/data#', 'p:')
      )
      .join(' ');
    return `
      PREFIX data: <http://nationaldigitaltwin.gov.uk/data#>
      PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
      PREFIX qudt: <http://qudt.org/2.1/schema/qudt/>
      PREFIX ndt: <http://nationaldigitaltwin.gov.uk/ontology#>
      PREFIX iesuncertainty: <http://ies.data.gov.uk/ontology/ies_uncertainty_proposal/v2.0#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX p: <http://nationaldigitaltwin.gov.uk/data#>
      SELECT
      (REPLACE(STR(?part_type), "http://nationaldigitaltwin.gov.uk/ontology#", "") AS ?PartType)
      (REPLACE(STR(?part_supertype), "http://nationaldigitaltwin.gov.uk/ontology#", "") AS ?PartSuperType)
      (REPLACE(STR(?insulation_type), "http://nationaldigitaltwin.gov.uk/ontology#", "") AS ?PartInsulationType)
      (REPLACE(STR(?insulation_thickness_mm), "http://nationaldigitaltwin.gov.uk/ontology#", "") AS ?InsulationThickness)
      (REPLACE(STR(?insulation_thickness_mm_lowerbound), "http://nationaldigitaltwin.gov.uk/ontology#", "") AS ?InsulationThicknessLowerBound)
      WHERE {{
          VALUES ?part {${parts}} .
          ?set_of_fused_things ndt:fusedInto ?part .
          ?set_of_fused_things rdfs:subClassOf ?part_type .
          ?part_type rdfs:subClassOf ?part_supertype .

          OPTIONAL {{
              ?insulation_fusion ies:isPartOf ?part .
              ?set_of_fused_insulation ndt:fusedInto ?insulation_fusion .
              ?set_of_fused_insulation rdfs:subClassOf ?insulation_type .
          }}

          OPTIONAL {{
              ?insulation_fusion ies:isPartOf ?part .
              ?insulation_fusion ies:hasCharacteristic ?quantity .
              OPTIONAL {{
                  ?quantity qudt:value ?insulation_thickness_mm .
              }}
              OPTIONAL {{
                  ?quantity qudt:lowerBound ?insulation_thickness_mm_lowerbound .
              }}
          }}
      }}
    `;
  }

  getAllDataPrefixesSelectWhere() {
    return `
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX ndt: <http://nationaldigitaltwin.gov.uk/ontology#>
    PREFIX geoplace: <https://www.geoplace.co.uk/addresses-streets/location-data/the-uprn#>
    SELECT
        (?uprn_id AS ?uprnId)
        (?building_toid_id AS ?toid)
        (?parent_building_toid_id AS ?parentToid)
        (?epcBound AS ?epc)
        (?propertyTypeBound As ?propertyType)
        (?line_of_address_literal AS ?fullAddress)
        (?postCodeBound AS ?postCode)
        (?buildFormBound AS ?buildForm)
    WHERE {
        ?building ies:inLocation ?address .

        ?state ies:isStateOf ?building .
        ?state a ?current_energy_rating .

        ?building ies:isIdentifiedBy ?uprn .
        ?uprn ies:representationValue ?uprn_id .
        ?uprn rdf:type geoplace:UniquePropertyReferenceNumber .

        ?building a ?building_type .

        #Property type
        ?building rdf:type ?property_type .
        ?property_type ies:powertype ndt:PropertyClass .

        #Built form
        ?building rdf:type ?build_form_type .
        ?build_form_type ies:powertype ndt:BuildFormClass .

        ?address ies:isIdentifiedBy ?line_of_address .
        ?line_of_address rdf:type ies:FirstLineOfAddress .
        ?line_of_address ies:representationValue ?line_of_address_literal .

        ?address ies:isIdentifiedBy ?postcode .
        ?postcode rdf:type ies:PostalCode .
        ?postcode ies:representationValue ?postcode_literal .

        OPTIONAL {
            ?building ies:isIdentifiedBy ?building_toid .
            ?building_toid rdf:type ies:TOID .
            ?building_toid ies:representationValue ?building_toid_id .
        }
        OPTIONAL {
            ?building ies:isPartOf ?parent_building .
            ?parent_building ies:isIdentifiedBy ?parent_building_toid .
            ?parent_building_toid ies:representationValue ?parent_building_toid_id .
            ?parent_building_toid rdf:type ies:TOID .
        }

        BIND(REPLACE(STR(?current_energy_rating), "http://gov.uk/government/organisations/department-for-levelling-up-housing-and-communities/ontology/epc#BuildingWithEnergyRatingOf", "") AS ?epcBound) .
        BIND(REPLACE(STR(?property_type), "http://nationaldigitaltwin.gov.uk/ontology#", "") AS ?propertyTypeBound) .
        BIND(SUBSTR(?postcode_literal, 0, 5) AS ?postCodeBound)
        BIND(REPLACE(STR(?build_form_type), "http://nationaldigitaltwin.gov.uk/ontology#", "") AS ?buildFormBound) .`;
  }

  prefixes() {
    return `
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX ndt: <http://nationaldigitaltwin.gov.uk/ontology#>
      PREFIX geoplace: <https://www.geoplace.co.uk/addresses-streets/location-data/the-uprn#>
      PREFIX epc: <http://gov.uk/government/organisations/department-for-levelling-up-housing-and-communities/ontology/epc#BuildingWithEnergyRatingOf>
    `;
  }

  selectStatement() {
    return `
      SELECT
        (?uprn_id AS ?UPRN)
        (?building_toid_id AS ?TOID)
        (?parent_building_toid_id AS ?ParentTOID)
        (REPLACE(STR(?current_energy_rating), "http://gov.uk/government/organisations/department-for-levelling-up-housing-and-communities/ontology/epc#BuildingWithEnergyRatingOf", "") AS ?EPC)
        (REPLACE(STR(?property_type), "http://nationaldigitaltwin.gov.uk/ontology#", "") AS ?PropertyType)
    `;
  }

  whereStatement() {
    return `
      ?state ies:isStateOf ?building .
      ?state a ?current_energy_rating .

      ?building ies:isIdentifiedBy ?uprn .
      ?uprn ies:representationValue ?uprn_id .
      ?uprn rdf:type geoplace:UniquePropertyReferenceNumber .

      ?building rdf:type ?property_type .
      ?property_type ies:powertype ndt:PropertyClass .
    `;
  }

  valuesStatement(fieldName: string, values: string[]) {
    const formattedValues = "'" + values.join("' '") + "'";
    return `
      VALUES ${fieldName} {${formattedValues}} .
    `;
  }

  optionalStatement() {
    return `
      OPTIONAL {
        ?building ies:isIdentifiedBy ?building_toid .
        ?building_toid rdf:type ies:TOID .
        ?building_toid ies:representationValue ?building_toid_id .
      }
      OPTIONAL {
          ?building ies:isPartOf ?parent_building .
          ?parent_building ies:isIdentifiedBy ?parent_building_toid .
          ?parent_building_toid ies:representationValue ?parent_building_toid_id .
          ?parent_building_toid rdf:type ies:TOID .
      }
    `;
  }

  filterStatement() {
    return `
      FILTER( ?current_energy_rating IN (epc:A))
      FILTER (?property_type IN (ndt:House))
      FILTER (?build_form_type IN (ndt:SemiDetached))
      FILTER (?postcode IN (ies:PO30))
    `;
  }

  groupByStatement() {
    return `
      GROUP BY
        ?uprn_id
        ?building_toid_id
        ?parent_building_toid_id
        ?current_energy_rating
        ?property_type
    `;
  }
}
