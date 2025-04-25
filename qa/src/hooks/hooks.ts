import { After, AfterAll, Before, BeforeAll, Status } from '@cucumber/cucumber';
import { Browser, BrowserContext } from '@playwright/test';
import { createLogger } from 'winston';
import * as fs from 'fs-extra';
import { basePage } from './basePage';
import { invokeBrowser } from '../helper/browsers/browserManager';
import { getEnv } from '../helper/env/env';
import { options } from '../helper/util/logger';

let browser: Browser;
let context: BrowserContext;

BeforeAll(async () => {
  getEnv();
  browser = await invokeBrowser();
});

Before(async ({ pickle }) => {
  const scenarioName = pickle.name + pickle.id;
  context = await browser.newContext({
    recordVideo: {
      dir: 'test-results/videos'
    }
  });
  await context.tracing.start({
    name: scenarioName,
    title: pickle.name,
    sources: true,
    screenshots: true,
    snapshots: true
  });
  basePage.page = await context.newPage();
  basePage.logger = createLogger(options(scenarioName));
});

After(async function TestCaseHook({ pickle, result }) {
  const path = `./test-results/trace/${pickle.id}.zip`;
  let videoPath: string;
  let img: Buffer;

  // Capture screenshot and video if the test passes
  if (result?.status === Status.PASSED) {
    img = await basePage.page.screenshot({
      path: `./test-results/screenshots/${pickle.name}.png`,
      type: 'png'
    });

    // Ensure video path exists before reading it
    const video = basePage.page.video();
    if (video) {
      videoPath = await video.path();
    } else {
      // eslint-disable-next-line no-console
      console.warn('No video recorded for this test.');
    }
  }

  // Stop tracing and save artifacts
  await context.tracing.stop({ path });
  await basePage.page.close();
  await context.close();

  // Attach the screenshot, video, and trace file if the test passed
  if (result?.status === Status.PASSED) {
    this.attach(img, 'image/png');

    // Ensure video file exists before attaching
    if (videoPath && fs.existsSync(videoPath)) {
      const videoData = fs.readFileSync(videoPath);
      this.attach(videoData, 'video/webm');
    } else {
      // eslint-disable-next-line no-console
      console.warn('Video file not found or not recorded.');
    }

    // Attach the trace file
    if (fs.existsSync(path)) {
      const traceFileLink = `<a href="https://trace.playwright.dev/">Open ${path}</a>`;
      this.attach(`Trace file: ${traceFileLink}`, 'text/html');
    } else {
      // eslint-disable-next-line no-console
      console.error('File does not exist.');
    }
  }
});

AfterAll(async () => {
  await browser.close();
});
