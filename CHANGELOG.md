# Changelog

**Repository:** `IRIS-visualisation`  
**Description:** `Tracks all notable changes, version history, and roadmap toward 1.0.0 following Semantic Versioning.`
**SPDX-License-Identifier:** OGL-UK-3.0
All notable changes to this repository will be documented in this file.
This project follows **Semantic Versioning (SemVer)** ([semver.org](https://semver.org/)), using the format:
 `[MAJOR].[MINOR].[PATCH]`
 - **MAJOR** (`X.0.0`) – Incompatible API/feature changes that break backward compatibility.
 - **MINOR** (`0.X.0`) – Backward-compatible new features, enhancements, or functionality changes.
 - **PATCH** (`0.0.X`) – Backward-compatible bug fixes, security updates, or minor corrections.
 - **Pre-release versions** – Use suffixes such as `-alpha`, `-beta`, `-rc.1` (e.g., `2.1.0-beta.1`).
 - **Build metadata** – If needed, use `+build` (e.g., `2.1.0+20250314`).

 ---

## [0.91.0] - 2025-07-04

### Features

  - [DPAV-589]: Redesigned header match common header style for NDTP apps.
  - [DPAV-326]: Implemented the new data loading approach
  - [DPAV-326]: Implemented caching of building data
  - [DPAV-967]: Restored advanced filter functionality after changes for new data loading approach

### Bugfixes

  - Playwright tests fixed
  - Draw polygon bug fixed

## [0.90.1] - 2025.03.28

### Features

 - Minor documentation updates

## [0.90.0] - 2025.03.28

### Features

 - View a choropleth map, summarising average EPC ratings per ward
 - Search for a property via address
 - Filter properties based on EPC rating, building type, postcode, drawn area and flagged status
 - Filter properties based on further attributes (roof type, insulation type etc)
 - View details (roof type, EPC rating, insulation type etc) of properties
 - Download details of properties
 - Flag a property to signal it's under investigation
 - Unflagging a property with a rationale
 - Viewing the reason why a property was unflagged


## [0.80.0] -2024-03-28
Contributions for the below IRIS visualisation features are with thanks to [Charlotteg](https://github.com/Charlotteg) and [CSturzaker](mailto:craig.sturzaker@arup.com).

### Features

* :iphone: update responsiveness
* :lipstick: first pass at responsive UI
* **data download:** add data download button and handlers
* **data download:** display warning for large area download
* **data download:** find addresses in polygon
* **data download:** hide results and details
* **Details Panel:** :sparkles: add expired EPC styling to UI
* **Filters:** :sparkles: add expired EPC filter
* **Filters:** :sparkles: hide clear all filters button when no filters are applied
* **filters:** add clear all filters button
* **filters:** clear flagged filter
* **filters:** reset form when all filters cleared
* **Map:** :sparkles: rotate north arrow with bearing
* **spatial filter:** override draw tool styling
* **spatial filter:** set button styles for button state
* **Filters:** :lipstick: style and add no dwellings warning
* **Filters:** :sparkles: indicate which advanced filters are valid
* **map:** mapbox logo
* **Minimap:** :sparkles: add minimap to bottom right corner
* **Minimap:** :sparkles: hide/show minimap
* **Map:** :sparkles: add 2D mode
* **Map:** :sparkles: add north orientation arrow
* **Data Download:** :sparkles: download in excel format
* **address search:** refine search results
* **postcode search:** add method to search for postcodes
* **details-panel:** flag history updates
* **map:** remove buildings with data from default
- **Details Panel:** :sparkles: add wall insulation to details panel
- **app:** add flagged toid colour to map
- **AddressSearch:** :sparkles: on selection of address from autocomplete, zoom to the address
- **AddressSearch:** :sparkles: select the building when you search for and zoom to an address
- **AddressSearch:** :sparkles: set up call to the os places api
- **angular material:** add angular material
- **app layout:** create shell component
- **app:** add color blind mode
- **app:** add dark mode
- **app:** add flagging
- **app:** add multi dwelling pattern support
- **app:** apply color blind color too all application elements in color blind mode
- **app:** apply color blind epc palette to all elements
- **app:** dark mode background and controls
- **app:** handle http errors
- **app:** opens snackbar to inform user and waits for dissmissal before redirecting to login
- **bookmarks:** add route guard to check route params
- **bookmarks:** get map state from route
- **bookmarks:** set map using inputs from route params
- **building details:** display part information
- **building parts:** add method to load building parts
- **core:** handle 401 from telicent api
- **Data Download:** :sparkles: add single address to data download panel
- **Data Download:** :sparkles: create UI for data download warning
- **Data Download:** :sparkles: implement zipfile download for singular dwelling download
- **data download:** download selected
- **data loading:** filter address data and join with buildings
- **data service:** add data service to query telicent IA
- **data service:** call data service to get uprns
- **data:** add address data csv file
- **data:** add call to no epc data query
- **data:** add csv of toids with uprns
- **data:** add methods to extract building parts
- **data:** add query for no epc buildings
- **data:** add query to load buildings data from IA
- **data:** add year of assessment
- **data:** load no epc data
- **data:** load sap ratings
- **data:** load toids and building data
- **data:** query ia and load data
- **data:** set selected uprns and query data
- **data:** update query to get all data for the app
- **data:** watch for data load
- **Details Panel:** :sparkles: add sap points to details panel EPC label
- **Details Panel:** :sparkles: add signal to open and close the details panel
- **Details Panel:** :sparkles: add uprn to the building details panel
- **Details Panel:** :sparkles: scaffold the ui for the details panel
- **details panel:** toggle panel visibility
- **details:** add glazing to details panel
- **download building:** download building from card
- **download:** download all buildings in results
- **draw:** add mapbox draw extension
- **draw:** setup draw methods
- **epc:** add method to get epc values for each building
- **filter button:** set default values
- **filter panel:** get selected filters
- **filter results:** handle panel open and close state
- **Filters:** :label: add in filter enums to generate filter options 
- **Filters:** :sparkles: add date & date range picker
- **Filters:** :sparkles: add date filter and refactor multi button filter to use correct types
- **Filters:** :sparkles: add dwelling size filter 
- **Filters:** :sparkles: hook multi-button filter up to parent form
- **Filters:** :sparkles: hook up the two main filters to construct a query and get data
- **Filters:** :sparkles: implement year of assessment filtering
- **Filters:** :sparkles: scaffold search bar, select filters and filter button
- **filters:** add clear all to main filters
- **filters:** add filter method
- **filters:** add filter url props
- **filters:** add flag toggle
- **filters:** add service for applying filters
- **filters:** clear all advanced filters
- **filters:** create filter string
- **filters:** implement flagged buildings filter
- **filters:** implement flagged filter
- **filters:** merge filter params in url
- **filters:** set advanced filters in url
- **filters:** set buildings to display results
- **filters:** set filter url param
- **filters:** set filters signal in utils service
- **flag history:** query IA to get flag history
- **Flag:** :sparkles: add flag info in the ui
- **flagging:** add get history query
- **load buildings:** load building data from csv file
- **load flags:** load all flags from IA
- **main filters:** set selected values if any exist
- **map controls:** add map control buttons
- **map controls:** add styling for map controls
- **map draw:** allow only one polygon to be drawn
- **map draw:** fix button hover style
- **map service:** add layer adding and filtering methods 
- **Map:** :sparkles: add legend into map controls
- **map:** add map bearing to config
- **map:** add map component to app
- **map:** add tooltips to map controls
- **mapbox draw:** add mapbox draw
- **mapbox draw:** implement polygon drawing functionality
- **map:** create map component
- **map:** drawing and filtering map layers
- **map:** get map state
- **map:** load epc point layer
- **map:** set map state in route
- **map:** setup map layout
- **no epc filter:** implement filtering for no epc buildings
- **os vector tiles:** load os vector tiles and extrude buildings
- **os vts:** add os api key property to environment
- **queries:** add query to get details for no epc building
- **queries:** details query for non-epc data
- **queries:** query to load all data
- **queries:** update building parts query
- **results card:** conditional property type for non-epc data
- **results card:** handle card selection and map zoom
- **results cards:** add hover and selected style
- **results cards:** scroll to selected parent building
- **results list:** scroll to selected results card
- **Results:** :recycle: refactor to display flats inside a parent expansion panel card
- **Results:** :sparkles: add expansion panel functionality
- **Results:** :sparkles: add icon buttons and labels to overview card
- **Results:** :sparkles: add results panel
- **Results:** :sparkles: scaffold header for results container
- **Results:** :sparkles: scaffold the results card
- **results:** add virtual scroll to results list
- **routing:** set up app routing
- **select building:** add method to select a building
- **select building:** add methods to select a building
- **select building:** add selected building layer
- **selected building:** deselect building if already selected
- **selected building:** store TOID of selected building
- **settings:** catch errors thrown by parsing json
- **shell component:** add shell container
- **shell:** add company logo
- **shell:** create shell component
- **spatial query service:** add service to perform spatial queries
- **spatial query:** add turf within library
- **spatial query:** get geometry for a building
- **spatial search:** emit spatial search area
- **turf:** install turf intersect
- **utils:** add method to parse epc ratings
- **utils:** add methods for data interaction

---

 ## Future Roadmap to `1.0.0`

 The `0.90.x` series is part of NDTP’s **pre-stable development cycle**, meaning:
 - **Minor versions (`0.91.0`, `0.92.0`...) introduce features and improvements** leading to a stable `1.0.0`.
 - **Patch versions (`0.90.1`, `0.90.2`...) contain only bug fixes and security updates**.
 - **Backward compatibility is NOT guaranteed until `1.0.0`**, though NDTP aims to minimise breaking changes.

 Once `1.0.0` is reached, future versions will follow **strict SemVer rules**.

 ## Versioning Policy  
1. **MAJOR updates (`X.0.0`)** – Typically introduce breaking changes that require users to modify their code or configurations.  
   - **Breaking changes (default rule)**: Any backward-incompatible modifications require a major version bump.  
   - **Non-breaking major updates (exceptional cases)**: A major version may also be incremented if the update represents a significant milestone, such as a shift in governance, a long-term stability commitment, or substantial new functionality that redefines the project’s scope.   
2. **MINOR updates (`0.X.0`)** – New functionality that is backward-compatible.  
3. **PATCH updates (`0.0.X`)** – Bug fixes, performance improvements, or security patches.  
4. **Dependency updates** – A **major dependency upgrade** that introduces breaking changes should trigger a **MAJOR** version bump (once at `1.0.0`).  
---
## How to Update This Changelog  
1. When making changes, update this file under the **Unreleased** section.  
2. Before a new release, move changes from **Unreleased** to a new dated section with a version number.  
3. Follow **Semantic Versioning** rules to categorise changes correctly.  
4. If pre-release versions are used, clearly mark them as `-alpha`, `-beta`, or `-rc.X`.  
---
**Maintained by the National Digital Twin Programme (NDTP).**  
© Crown Copyright 2025. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.  
Licensed under the Open Government Licence v3.0.  
For full licensing terms, see [OGL_LICENSE.md](OGL_LICENSE.md). 
