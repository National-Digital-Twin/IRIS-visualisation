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

  getAllData() {
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
          (REPLACE(STR(?current_energy_rating), "http://gov.uk/government/organisations/department-for-levelling-up-housing-and-communities/ontology/epc#BuildingWithEnergyRatingOf", "") AS ?EPC)
          (REPLACE(STR(?property_type), "http://nationaldigitaltwin.gov.uk/ontology#", "") AS ?PropertyType)
          (REPLACE(STR(?build_form_type), "http://nationaldigitaltwin.gov.uk/ontology#", "") AS ?BuildForm)
          (?inspection_date_literal AS ?InspectionDate)
          (?line_of_address_literal AS ?FullAddress)
          (SUBSTR(?postcode_literal, 0, 5) AS ?PostCode)
          #(GROUP_CONCAT(?part; SEPARATOR="; ") as ?parts)
          (GROUP_CONCAT(DISTINCT REPLACE(STR(?part_type), "http://nationaldigitaltwin.gov.uk/ontology#", ""); SEPARATOR="; ") as ?part_types)
          #(GROUP_CONCAT(?insulation_type; SEPARATOR="; ") as ?insulation_types)
          #(GROUP_CONCAT(?insulation_fusion; SEPARATOR="; ") as ?insulation_fusions)
          #(GROUP_CONCAT(?insulation_thickness_mm; SEPARATOR="; ") as ?insulation_thicknesses_mm)
          #(GROUP_CONCAT(?insulation_thickness_mm_lowerbound; SEPARATOR="; ") as ?insulation_thicknesses_mm_lowerbound)

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
          OPTIONAL {{
              ?part ies:isPartOf ?state .
              ?set_of_fused_things ndt:fusedInto ?part .
              ?set_of_fused_things rdfs:subClassOf ?part_type .
          }}
          #OPTIONAL {{
          #    ?insulation_fusion ies:isPartOf ?part .
          #    ?set_of_fused_insulation ndt:fusedInto ?insulation_fusion .
          #    ?set_of_fused_insulation rdfs:subClassOf ?insulation_type .
          #    OPTIONAL {{
          #        ?insulation_fusion ies:hasCharacteristic ?quantity .
          #        ?insulation_fusion ies:isPartOf ?part .
          #        OPTIONAL {{
          #            ?quantity qudt:value ?insulation_thickness_mm .
          #        }}
          #        OPTIONAL {{
          #            ?quantity qudt:lowerBound ?insulation_thickness_mm_lowerbound .
          #        }}
          #    }}
          #}}
      }
      GROUP BY
          ?part_types
          ?uprn_id
          ?building_toid_id
          ?parent_building_toid_id
          ?current_energy_rating
          ?property_type
          ?build_form_type
          ?postcode_literal
          ?line_of_address_literal
          ?inspection_date_literal
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
}
