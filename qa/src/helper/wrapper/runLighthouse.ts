/* eslint-disable no-console */
import lighthouse from 'lighthouse';
import * as fs from 'fs';
import * as path from 'path';
import { launch } from 'chrome-launcher';

import LoginPage from '../../pages/loginPage';
import { basePage } from '../../hooks/basePage';

let nloginPage: LoginPage;

export async function runLighthouse(url: string, outputDir = 'test-results/lighthouse-reports') {
    // Launch a headless Chromium browser with debugging enabled
    const chrome = await launch({ chromeFlags: ['--headless'] });

    // eslint-disable-next-line no-use-before-define
    const cookieHeader = await getUserLogin();

    // Run Lighthouse on the given URL using the Chromium instance
    const result = await lighthouse(process.env.LISAURL, {
        port: chrome.port,
        output: ['json', 'html'],
        logLevel: 'info',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        extraHeaders: {
            Cookie: cookieHeader, // Pass cookies for authentication
        },
    });

    // Save the report
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save JSON and HTML reports
    const jsonReportPath = path.join(outputDir, 'lighthouse-report.json');
    const htmlReportPath = path.join(outputDir, 'lighthouse-report.html');

    fs.writeFileSync(jsonReportPath, JSON.stringify(result.lhr, null, 2));
    fs.writeFileSync(htmlReportPath, result.report[1]); // HTML report

    console.log(`Lighthouse JSON report saved: ${jsonReportPath}`);
    console.log(`Lighthouse HTML report saved: ${htmlReportPath}`);

    chrome.kill(); // Close Chromium after the test
    return result.lhr;
}

async function getUserLogin() {
    nloginPage = new LoginPage(basePage.page);
    await nloginPage.navigateToLoginPage(process.env.LISAURL);
    basePage.logger.info('Navigated to the application');
    await nloginPage.loginUser(process.env.USERNAME, process.env.PASSWORD);

    await basePage.page.waitForURL(process.env.LISAURL);

    // Get cookies after login
    const cookies = await basePage.page.context().cookies();
    console.log('Cookies:', cookies);

    // Extract the cookies in a formatted string (useful for Lighthouse or API requests)
    const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
    console.log('Formatted Cookies:', cookieHeader);

    return cookieHeader;
}
