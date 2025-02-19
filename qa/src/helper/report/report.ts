import report = require('multiple-cucumber-html-reporter');

report.generate({
  jsonDir: 'test-results',
  reportPath: 'test-results/reports/',
  reportName: 'NDTP Automation Report',
  pageTitle: 'IRIS report',
  displayDuration: false,
  metadata: {
    browser: {
      name: 'chrome',
      version: '112',
    },
    device: 'VM Default',
    platform: {
      name: 'Ubuntu 64 bit',
      version: '1',
    },
  },
  customData: {
    title: 'Test Exit Report',
    data: [
      { label: 'Project', value: 'LISA Application' },
      { label: 'Release', value: '1.2.x' },
      { label: 'Cycle', value: 'Smoke-1' }
    ],
  },
});
