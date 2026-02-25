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

## [0.96.0] - 2026-02-25

- [DPAV-2419]: Added empty warnings tab
- [DPAV-1686]: Added models for building level climate data, changed warning tab to more info
- [DPAV-1686]: Removed refs to flagging in the app
- [DPAV-2417]: Completed the WDR section item for the building detail panel
- [DPAV-2415]: Completed the icing days section item for the building details panel
- [DPAV-2416]: Completed the hot summer days section item for the building details panel
- [DPAV-2420]: Added logic to show warnings to the climate data sections in the building details panel
- [DPAV-2487]: added high deprivation layer and associated popover
- [DPAV-2496]: Added code to be able to download weather data for a single building
- [DPAV-2496]: Implemented new approach to bulk data download along with weather data
- [DPAV-2499]: added deprivation charts for national + area views
- [DPAV-2418]: Added hours of sunlight section item to the building details panel
- [DPAV-2496]: Added sunlight hours data to bulk download and fixed general issues with downloads
- [DPAV-1686]: implemented design and imeplemtnation tweaks to the buildings details panel
- [DPAV-1685]: hours of sunlight layer implementation
- [DPAV-1686]: Ensured the weather data requests all dont fail if one fails
- [DPAV-2495]: Changed title of the epc rating by chart for the area defined view
- [DPAV-1686]: Content changes post design review for the weather data sections
- [DPAV-2487]: Design feedback implemented
- [DPAV-2541]: Added downloadable modal component to provide more info about the weather sections
- [DPAV-2487]: Fixed pluralisation when only 1 household in an area is deprived
- [DPAV-1685]: Implemented feedback from dev testing for sunlight hours layer
- [DPAV-2541]: Added downloadable modal for the sunlight hours section item
- [DPAV-2497]: Added hours of sunlight by region chart
- [DPAV-2498]: Handle hours of sunlight chart with polygon selection
- [DPAV-2541]: Completed modal content for all weather sections
- [DPAV-2541]: Implemented feedback from dev testing for downloadable content modal


## [0.95.1] - 2026-01-22

- [DPAV-2532]: refactored popup registration and management within the map to fix routing issues


## [0.95.0] - 2026-01-12

### Features

- [DPAV-1779]: extract and refactor Plotly from tech spike
- [DPAV-1779]: area dashboard
- [DPAV-1779]: support selectedArea in charts
- [DPAV-1779]: reduce initial bundle size
- [DPAV-1779]: update dialog content to match design
- [NON-REQ]: added fixes for floor construction mapping and advanced filters
- [DPAV-1779]: add building fuel types chart
- [DPAV-1688]: update chart icon to match design
- [DPAV-1779]: rename to generic interface name
- [DPAV-1688]: disabled layer click handlers when drawing
- [NON-REQ]: added icons for secondary layer menus
- [DPAV-1955]: fuel chart graph: add tests and matched finalised designs
- [DPAV-1956]: added the number of buildings affected by extreme weather chart
- [DPAV-1962]: epc ratings by region: tests and match design
- [DPAV-1961]: added the expired vs in date epc chart
- [DPAV-1951]: update average SAP over time chart
- [DPAV-1968]: add named areas dashboard
- [DPAV-1961]: add in-date vs expired chart to area dashboards
- [DPAV-1957]: add extreme weather chart to area dashboards
- [DPAV-1970]: add info text to Area view button
- [DPAV-1955]: change fuel types graph to horizontal bar
- [DPAV-1963]: update percentage of buildings with graph to match designs
- [DPAV-1968]: allow changing area level if nothing selected
- [DPAV-1779]: New EPC charts and styling updates
- [DPAV-2061]: charts: improve error handling and state management
- [DPAV-1954]: add custom scrollbar to epc-by-area-chart
- [DPAV-1778] & [DPAV-1779]: add SAP timeline by area/property type charts
- [DPAV-1959]: hide SAP by area if single area selected

### Bugfixes

- [DPAV-1968]: correct counties pluralization and drawer style
- [DPAV-1955]: fix fuel types graph sort
- [DPAV-1957]: prevent custom legend being cut off
- [DPAV-1779]: handle single points on timeline graphs better
- [NON-REQ]: small fix to correct hsd layer values
- [DPAV-1955]: aggregate fuel type labels
- [DPAV-2119]: Fixed issue with routing when refreshing dashboard
- [DPAV-1963]: flipped the orientation of the building characteristics chart to horizontal
- [DPAV-1931]: fixed spelling issue with epc rating over time chart

## [0.94.4] - 2025-10-24

### Bugfixes

- [DPAV-1967]: Fixed aggressive rounding of epc layer histogram values

## [0.94.2] - 2025-10-23

### Bugfixes

- Fixed data mapping for floor construction.
- Fixed advanced filters issue with built form.


## [0.94.1] - 2025-10-14

### Features

- [DPAV-1728]: Display EPC completeness percentages alongside area names in analytics popups
- [DPAV-1730]: Activate the district EPC layer by default on initial map load
- [DPAV-1732]: Simplify large number formatting across analytics charts and popups
- [DPAV-1737]: Highlight parent items in the layer menu when any child layer is active
- [DPAV-1684]: Added OS roof data to advanced filters
- [DPAV-1594]: OS NGD buildings PostGIS fallback
- [DPAV-1455]: Facilitated other EPC layers
- [DPAV-1291]: UI and proxy changes for OS NGD buildings data
- [DPAV-1456]: Added nationwide ward layer
- [DPAV-1663]: Updated tooltip location on popouts
- [DPAV-1291]: Added climate data layers
- [DPAV-1493]: Added wind-driven rain and other placeholder layers
- [DPAV-1452]: Toggling of future layers
- [DPAV-1818]: Display EPC completeness percentages alongside area names in analytics popups

### Bugfixes

- [DPAV-1727]: Prevent EPC analytics layers appearing alongside 3D buildings
- [DPAV-1729]: Ensure only one map control can be open at a time
- [DPAV-1684]: Fixed clear filters and EPC chart styling
- [DPAV-1487]: Removed outline when deselecting a layer
- [DPAV-1488]: Fixed highlighting for selected polygons

### Other

- [DPAV-1760]: Refined roof aspect area labels in the detailed building view, including the indeterminable value
- [DPAV-1731]: Removed commercial building data from EPC analytics
- [OSPO]: Move to unprivileged NGINX containers
- Added additional resources for local development
- Reverted visualiser secret

## [0.93.5] - 2025-10-14

### Features

- [DPAV-1818]: IRIS Privacy notice

## [0.92.1] - 2025-07-22

- Updated changelog prior to release 0.92.0

## [0.92.0] - 2025-07-18

### Features

- [DPAV-1352]: Updated detailed building view to show main fuel type

## [0.91.0] - 2025-07-04

### Features

  - [DPAV-589]: Redesigned header match common header style for NDTP apps.
  - [DPAV-326]: Implemented the new data loading approach
  - [DPAV-326]: Implemented caching of building data
  - [DPAV-967]: Restored advanced filter functionality after changes for new data loading approach

### Bugfixes

  - Playwright tests fixed
  - Draw polygon bug fixed

### Other

  - Updated dependencies to latest version

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
