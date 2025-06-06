import { Given, setDefaultTimeout } from '@cucumber/cucumber';

import { basePage } from '../../hooks/basePage';
import LoginPage from '../../pages/loginPage';
import SearchViewPage from '../../pages/iris/searchViewPage';

let loginPage: LoginPage;
let searchViewPage: SearchViewPage;

setDefaultTimeout(60 * 1000 * 2);

Given('I login to the ndtp app with the user credentials', async () => {
    loginPage = new LoginPage(basePage.page);
    await loginPage.navigateToLoginPage(process.env.BASEURL);
    basePage.logger.info('Navigated to the application');
    await loginPage.loginUser(process.env.TESTUSER, process.env.TESTPASS);
});


Given('I am a valid user logged into the {string} NDTP application', async function (appName) {
    loginPage = new LoginPage(basePage.page);

    const landingSite = appName === 'IRIS' ? process.env.IRISURL : process.env.BASEURL;

    await loginPage.navigateToLoginPage(landingSite);
    basePage.logger.info('Navigated to the application');
    await loginPage.loginUser(process.env.TESTUSER, process.env.TESTPASS);
    await basePage.sleep(1000);

    searchViewPage = new SearchViewPage(basePage.page);
    await searchViewPage.verifyIrisSearchViewPage();

});
