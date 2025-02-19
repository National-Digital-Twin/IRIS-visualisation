import { Page } from '@playwright/test';
import { Logger } from 'winston';

export const basePage = {
  page: undefined as Page,
  logger: undefined as Logger,

  sleep: (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

};


