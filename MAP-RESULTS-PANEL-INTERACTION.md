# MAP - RESULTS PANEL INTERACTION

Notes on the various util functions used to handle the interaction between the map and results & details panels

## FILTERED DATA - SINGLE DWELLING

### SELECT CARD (utilService > resultsCardSelected)

- select building on map
- highlight card

### DESELECT CARD (utilService > resultsCardDeselected)

- remove map selection
- remove card highlight
- close details panel

### VIEW DETAILS BUTTON (utilService > viewDetailsButtonClick)

- select building on map
- highlight card
- open details panel
- zoom to building

### CLOSE DETAILS PANEL (utilService > closeDetailsButtonClick)

- close details panel

### SELECT BUILDING ON MAP (utilService > singleDwellingSelectedOnMap)

- select building on map
- highlight card
- open details panel

### DESELECT BUILDING ON MAP (utilService > singleDwellingDeselected)

- remove map selection
- remove card highlight
- close details panel

## FILTERED DATA - MULTI DWELLING

- TODO

## UNFILTERED DATA - SINGLE DWELLING

### SELECT BUILDING ON MAP (utilService > singleDwellingSelectedOnMap)

- select building on map
- open details panel

### CLOSE DETAILS PANEL (utilService > closeDetailsButtonClick)

- remove map selection
- close details panel

### DESELECT BUILDING ON MAP (utilService > singleDwellingDeselected)

- remove map selection
- close details panel

## UNFILTERED DATA - MULTI DWELLING

### SELECT BUILDING ON MAP (utilService > selectMultiDwellingOnMap)

- select building on map
- open results panel

### SELECT CARD (utilService > resultsCardSelected)

- select building on map
- highlight card

### DESELECT CARD (utilService > resultsCardDeselected)

- remove card highlight
- close details panel

### VIEW DETAILS BUTTON (utilService > viewDetailsButtonClick)

- highlight card
- open details panel

### CLOSE DETAILS PANEL (utilService > closeDetailsButtonClick)

- close details panel

### DESELECT BUILDING ON MAP (utilService > multiDwellingDeselected)

- remove map selection
- close details panel
- close results panel
