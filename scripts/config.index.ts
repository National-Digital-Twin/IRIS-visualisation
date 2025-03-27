import { writeFile } from 'fs';

const env = process.env.ENV;

const production = env === 'prod';

const osAPIKey = process.env.OS_API_KEY;

const posthogAPIKey = process.env.POSTHOG_KEY;

const targetPath = `./src/environments/environment.ts`;

const envConfigFile = `export const environment = {
    production: ${production},
        os: {
            apiKey: '${osAPIKey}',
        },
        posthog: {
            apiKey: '${posthogAPIKey}',
        },
    };
`;

writeFile(targetPath, envConfigFile, 'utf8', (err) => {
    if (err) {
        return console.log(err);
    }
});
