import { Given, When, Then } from '@cucumber/cucumber';
import { basePage } from '../../hooks/basePage';
import SearchViewPage from '../../pages/iris/searchViewPage';

let searchViewPage: SearchViewPage;

Given('I enter the {string} details in the search field', async function (searchString) {
    searchViewPage = new SearchViewPage(basePage.page);
    searchViewPage.enterSearchString(searchString);
});

Given('I select the {string} from the dropdown list', async function (searchString) {
    searchViewPage = new SearchViewPage(basePage.page);
    searchViewPage.selectAddressFromDropdown(searchString);

    await sleep(10000);
});

When('I click the property {string}', async function (string) {
    searchViewPage = new SearchViewPage(basePage.page);
    // coordinates for selected house
    await basePage.sleep(10000);
    await searchViewPage.clickMapLocation(632, 368);
});

Then('I should be able to view the property details', async function () {
    searchViewPage = new SearchViewPage(basePage.page);
    await searchViewPage.verifyDetailsPanelVisible();
});

Then('I should be a able to zoom on the property', async function () {
    searchViewPage = new SearchViewPage(basePage.page);
    await searchViewPage.zoomOnTheMapWithScreenshotComparison();
});

When('I zoom out on the map to display wards', async function () {
    searchViewPage = new SearchViewPage(basePage.page);
    await searchViewPage.zoomOutOfTheMap(3);
    await basePage.sleep(2000);
});

Then('I should be able to click on a ward', async function () {
    searchViewPage = new SearchViewPage(basePage.page);
    await basePage.sleep(2000);
    await searchViewPage.clickMapLocation(450,386);
    await basePage.sleep(500);
});

Then('I should see the Ward Details panel', async function () {
    searchViewPage = new SearchViewPage(basePage.page);
    await searchViewPage.verifyWardDetailsPanelVisible();
});

Then('I should be able to pan around the map', async function () {
    searchViewPage = new SearchViewPage(basePage.page);
    await searchViewPage.panWithScreenshotComparison();
});

Then('I should be able to add a flag to the property', async function () {
    searchViewPage = new SearchViewPage(basePage.page);
    await searchViewPage.addPropertyFlag();
});

//TODO: Will be implemented in the next PR
Then('I should be able to remove a flag to the property', async function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

//TODO: Will be implemented in the next PR
Then('I should be able to view the reason for removal of a Flag from a property', async function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

When('I add the Filter area around the multiple properties', async function () {
    searchViewPage = new SearchViewPage(basePage.page);
    await searchViewPage.drawFilterArea();
});

//TODO: Will be implemented in the next PR
Then('I should view the filtered properties in the area', async function () {
    searchViewPage = new SearchViewPage(basePage.page);
    await searchViewPage.verifyFilteredPropertiesPanelVisible();
});

//TODO: Will be implemented in the next PR
Then('I should be able add additional filter by {string}', async function (filterType: string) {
    searchViewPage = new SearchViewPage(basePage.page);
    await searchViewPage.addNewFilter(filterType);
});

export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

