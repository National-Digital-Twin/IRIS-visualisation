export class Queries {
  getNoEPCBuildingDetails(uprn: string) {
    return `
      PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

      SELECT
          (REPLACE(STR(?uprn), "http://nationaldigitaltwin.gov.uk/data#uprn_", "") as ?UPRN)
          (?line_of_address_literal AS ?FullAddress)
          (SUBSTR(?postcode_literal, 0, 5) AS ?PostCode)
      WHERE {{
          ?building ies:isIdentifiedBy ?uprn .
          ?uprn ies:representationValue "${uprn}" .

          OPTIONAL {
            ?building ies:inLocation ?address .
            ?address ies:isIdentifiedBy ?postcode .
            ?postcode rdf:type ies:PostalCode .
            ?postcode ies:representationValue ?postcode_literal .

            ?address ies:isIdentifiedBy ?line_of_address .
            ?line_of_address rdf:type ies:FirstLineOfAddress .
            ?line_of_address ies:representationValue ?line_of_address_literal .
          }
      }}
      GROUP BY
          ?uprn
          ?postcode_literal
          ?line_of_address_literal
    `;
  }

  /**
   * Query to get all data for buildings with EPC ratings
   * @returns query string
   */
  getEPCData() {
    return `
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX ndt: <http://nationaldigitaltwin.gov.uk/ontology#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX geoplace: <https://www.geoplace.co.uk/addresses-streets/location-data/the-uprn#>
      PREFIX qudt: <http://qudt.org/2.1/schema/qudt/>
        SELECT
            (?uprn_id AS ?UPRN)
            (?building_toid_id AS ?TOID)
            (?parent_building_toid_id AS ?ParentTOID)
            (STRAFTER(STR(?current_energy_rating), "BuildingWithEnergyRatingOf") AS ?EPC)
            (STRAFTER(STR(?property_type), "#") AS ?PropertyType)
            (STRAFTER(STR(?build_form_type), "#") AS ?BuildForm)
            (?inspection_date_literal AS ?InspectionDate)
            (?line_of_address_literal as ?FullAddress)
            (SUBSTR(?postcode_literal, 0, 5) AS ?PostCode)
            (GROUP_CONCAT(STRAFTER(STR(?part_type), "#"); SEPARATOR="; ") as ?PartTypes)
            (GROUP_CONCAT(COALESCE(STRAFTER(STR(?insulation_type), "#"), "NA"); SEPARATOR="; ") as ?InsulationTypes)
            (GROUP_CONCAT(COALESCE(?insulation_thickness_mm, "NA"); SEPARATOR="; ") as ?InsulationThickness)
            (GROUP_CONCAT(COALESCE(?insulation_thickness_mm_lowerbound, "NA"); SEPARATOR="; ") as ?InsulationThicknessLowerBound)
        WHERE {
            ?state ies:isStateOf ?building .
            ?state a ?current_energy_rating .

            ?building ies:isIdentifiedBy ?uprn .
            ?uprn ies:representationValue ?uprn_id .
            ?uprn rdf:type geoplace:UniquePropertyReferenceNumber .

            ?building rdf:type ?property_type .
            ?property_type ies:powertype ndt:PropertyClass .
            OPTIONAL {
                ?building rdf:type ?build_form_type .
                ?build_form_type ies:powertype ndt:BuildFormClass .
            }

            ?building ies:inLocation ?address .
            ?address ies:isIdentifiedBy ?line_of_address .
            ?line_of_address rdf:type ies:FirstLineOfAddress .
            ?line_of_address ies:representationValue ?line_of_address_literal .

            ?address ies:isIdentifiedBy ?postcode .
            ?postcode rdf:type ies:PostalCode .
            ?postcode ies:representationValue ?postcode_literal .

            ?state ies:inPeriod ?inspection_date .
            ?inspection_date ies:iso8601PeriodRepresentation ?inspection_date_literal .

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
            OPTIONAL {
                ?part ies:isPartOf ?state .

                ?set_of_fused_things ndt:fusedInto ?part .
                ?set_of_fused_things rdfs:subClassOf ?part_type .

                OPTIONAL {

                    ?insulation_fusion ies:isPartOf ?part .
                    ?set_of_fused_insulation ndt:fusedInto ?insulation_fusion .
                    ?set_of_fused_insulation rdfs:subClassOf ?insulation_type .
                    OPTIONAL {
                        ?insulation_fusion ies:hasCharacteristic ?quantity .
                        ?insulation_fusion ies:isPartOf ?part .
                        OPTIONAL {
                            ?quantity qudt:value ?insulation_thickness_mm .
                        }
                        OPTIONAL {
                            ?quantity qudt:lowerBound ?insulation_thickness_mm_lowerbound .
                        }
                    }
                }
            }
        }
        GROUP BY
            ?uprn_id
            ?building_toid_id
            ?parent_building_toid_id
            ?property_type
            ?build_form_type
            ?line_of_address_literal
            ?postcode_literal
            ?current_energy_rating
            ?inspection_date_literal
            ?part_types
            ?insulation_types
            ?insulation_thicknesses_mm
            ?insulation_thicknesses_mm_lowerbound
    `;
  }

  /**
   * Query to get all buildings that don't have EPC ratings
   */
  getNoEPCData() {
    return `
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX ndt: <http://nationaldigitaltwin.gov.uk/ontology#>
      PREFIX geoplace: <https://www.geoplace.co.uk/addresses-streets/location-data/the-uprn#>
      SELECT
          (?uprn_literal AS ?UPRN)
          (?building_toid_id AS ?TOID)
          (?line_of_address_literal as ?FullAddress)
          (?parent_building_toid_id AS ?ParentTOID)
          (SUBSTR(?postcode_literal, 0, 5) AS ?PostCode)
      WHERE {
          ?building ies:isIdentifiedBy ?uprn .
          ?uprn ies:representationValue ?uprn_literal .
          ?uprn a geoplace:UniquePropertyReferenceNumber .
          FILTER NOT EXISTS { ?epc_state ies:isStateOf ?building . }

          OPTIONAL {
              ?building ies:inLocation ?address .
              ?address ies:isIdentifiedBy ?line_of_address .
              ?line_of_address rdf:type ies:FirstLineOfAddress .
              ?line_of_address ies:representationValue ?line_of_address_literal .

              ?address ies:isIdentifiedBy ?postcode .
              ?postcode rdf:type ies:PostalCode .
              ?postcode ies:representationValue ?postcode_literal .
          }

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
          ?uprn_literal
          ?building_toid_id
          ?line_of_address_literal
          ?parent_building_toid_id
          ?postcode_literal
    `;
  }

  getFlagHistory(uprn: string) {
    return `
      PREFIX data: <http://nationaldigitaltwin.gov.uk/data#>
      PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

      SELECT
          (REPLACE(STR(?uprn), "http://nationaldigitaltwin.gov.uk/data#uprn_", "") as ?UPRN)
          (?flag as ?Flagged)
          (REPLACE(STR(?flag_type), "http://nationaldigitaltwin.gov.uk/data#", "") as ?FlagType)
          (?given_name_literal AS ?FlaggedByGivenName)
          (?surname_literal AS ?FlaggedBySurname)
          (REPLACE(STR(?flag_date), "http://iso.org/iso8601#", "") as ?FlagDate)
          (REPLACE(STR(?flag_ass_date), "http://iso.org/iso8601#", "") AS ?AssessmentDate)
          (?assessor_given_name_literal AS ?AssessorGivenName)
          (?assessor_surname_literal AS ?AssessorSurname)
          (REPLACE(STR(?flag_assessment_type), "http://nationaldigitaltwin.gov.uk/ontology#", "") as ?AssessmentReason)
      WHERE {{
          ?building ies:isIdentifiedBy ?uprn .
          ?uprn ies:representationValue "${uprn}" .

          OPTIONAL {{
              ?flag ies:interestedIn ?building .
              ?flag ies:isStateOf ?flag_person .
              ?flag_person ies:hasName ?flag_person_name .
              ?surname a ies:Surname .
              ?surname ies:inRepresentation ?flag_person_name .
              ?surname ies:representationValue ?surname_literal .
              ?given_name a ies:GivenName .
              ?given_name ies:inRepresentation ?flag_person_name .
              ?given_name ies:representationValue ?given_name_literal .
              ?flag a ?flag_type .
              ?flag ies:inPeriod ?flag_date .
              OPTIONAL {{
                  ?flag_assessment ies:assessed ?flag .
                  ?flag_assessment ies:inPeriod ?flag_ass_date .
                  ?flag_assessment ies:assessor ?flag_assessor .
                  ?flag_assessor ies:hasName ?flag_assessor_name .
                  ?surname a ies:Surname .
                  ?surname ies:inRepresentation ?flag_assessor_name .
                  ?surname ies:representationValue ?assessor_surname_literal .
                  ?given_name a ies:GivenName .
                  ?given_name ies:inRepresentation ?flag_assessor_name .
                  ?given_name ies:representationValue ?assessor_given_name_literal .
                  ?flag_assessment rdf:type ?flag_assessment_type .
              }}
          }}
      }}
      GROUP BY
          ?flag
          ?flag_type
          ?flag_person
          ?flag_assessment
          ?flag_date
          ?flag_ass_date
          ?flag_assessor
          ?flag_assessment_type
          ?surname_literal
          ?given_name_literal
          ?assessor_given_name_literal
          ?assessor_surname_literal
          ?uprn
    `;
  }

  getSAPPoints() {
    return `
      PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
      PREFIX ndt: <http://nationaldigitaltwin.gov.uk/ontology#>
      PREFIX epc: <http://gov.uk/government/organisations/department-for-levelling-up-housing-and-communities/ontology/epc#>
      PREFIX qudt: <http://qudt.org/2.1/schema/qudt/>
      PREFIX geoplace: <https://www.geoplace.co.uk/addresses-streets/location-data/the-uprn#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

      SELECT
          (?uprn_id AS ?UPRN)
          (?sap_points AS ?SAPPoint)
      WHERE {
        ?state ies:isStateOf ?building .
          ?building ies:isIdentifiedBy ?uprn .
          ?uprn ies:representationValue ?uprn_id .
          ?uprn rdf:type geoplace:UniquePropertyReferenceNumber .
          ?state ies:hasCharacteristic ?quantity .
          ?quantity qudt:value ?sap_points .
      }
    `;
  }
}
