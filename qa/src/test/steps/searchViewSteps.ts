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

When('I click  the property {string}', async function (string) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('I should be able to view the property details', async function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('I should be a able to zoom on the property', async function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

When('I search a location by ward details', async function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('I should be able to click on a ward', async function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('I should be able to pan around the map', async function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('I should be able to add a flag to the property', async function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('I should be able to remove a flag to the property', async function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('I should be able to view the reason for removal of a Flag from a property', async function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

When('I add the Filter area around the multiple properties', async function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('I should view the filtered properties in the area', async function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('I should be able add additional filter by {string}', async function (string) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
