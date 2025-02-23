import { LaunchOptions, chromium, firefox, webkit } from '@playwright/test';

const options: LaunchOptions = {
    headless: false,
    args: ['--start-maximized'], // Maximizes the browser window
};
export const invokeBrowser = () => {
    const browserType = process.env.npm_config_BROWSER || 'chrome';
    switch (browserType) {
        case 'chrome':
            return chromium.launch(options);
        case 'firefox':
            return firefox.launch(options);
        case 'webkit':
            return webkit.launch(options);
        default:
            throw new Error('Please set the proper browser!');
    }
};
