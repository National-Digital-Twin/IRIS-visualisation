Feature: Search View Feature

@functional
Scenario: Verify the View the Property functional features 
Given I am a valid user logged into the "IRIS" NDTP application
   And I enter the "20, Shide Road, Newport PO30 1YQ" details in the search field
   And I select the "20, Shide Road, Newport PO30 1YQ" from the dropdown list
When I click the property "20, Shide Road, Newport PO30 1YQ"
   Then I should be able to view the property details
   And I should be a able to zoom on the property


@functional @ignore
Scenario: Verify the IRIS functionalities at a WARD level on the functional features 
   Given I am a valid user logged into the "IRIS" NDTP application
   When I search a location by ward details
   Then I should be able to click on a ward  
   Then I should be able to pan around the map


@functional @ignore
Scenario: Verify the Add and Remove Flag option should be available to the Property functional features 
Given I am a valid user logged into the "IRIS" NDTP application
   And I enter the "20, Shide Road, Newport PO30 1YQ" details in the search field
   And I select the "20, Shide Road, Newport PO30 1YQ" from the dropdown list
When I click the property "20, Shide Road, Newport PO30 1YQ"
   Then I should be able to add a flag to the property
   And I should be able to remove a flag to the property
   And I should be able to view the reason for removal of a Flag from a property


@functional @ignore
Scenario: Verify the Filter functionality for the multiple properties
   Given I am a valid user logged into the "IRIS" NDTP application
   When I add the Filter area around the multiple properties
   Then I should view the filtered properties in the area
   And I should be able add additional filter by "EPC Rating"
