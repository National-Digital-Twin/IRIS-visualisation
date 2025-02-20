import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { Result } from 'lighthouse';
import { runLighthouse } from '../../helper/wrapper/runLighthouse';

let lighthouseReport: Result;

When('I run Lighthouse analysis for IRIS {string} page', async (pageName) => {
    lighthouseReport = await runLighthouse(pageName);
});

Then('the performance score should be at least {int}', (threshold: number) => {
    const performanceScore = lighthouseReport.categories.performance.score * 100;
    // eslint-disable-next-line no-console
    console.log(`Performance Score: ${performanceScore}`);
    expect(performanceScore).toBeGreaterThanOrEqual(threshold);
});
