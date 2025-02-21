export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            BROWSER: 'chrome' | 'firefox' | 'webkit';
            ENV: 'staging' | 'prod' | 'demo' | 'test';
            BASEURL: string;
            IRISURL: string;
            HEAD: 'true' | 'false';
            USERNAME: string;
        }
    }
}
