import { ContainerTheme } from '@arc-web/components/src/components/container/constants/ContainerConstants';

export type Theme = Extract<ContainerTheme, 'light' | 'dark'>;
