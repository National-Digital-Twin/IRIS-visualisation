export { };

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            BROWSER: 'chrome' | 'firefox' | 'webkit',
            ENV: 'staging' | 'prod' | 'demo' | 'test',
            BASEURL: string,
            LISAURL: string,
            IRISURL: string,
            PARALOGURL: string,
            HEAD: 'true' | 'false'
            USERNAME: string,
        }
    }
}
