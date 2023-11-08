import { writeFile } from 'fs';

const env = process.env.ENV;

const production = env == 'prod' ? true : false;

const apiKey = process.env.MAPBOX_API_KEY;

const targetPath = `./src/environments/environment.ts`;

const envConfigFile = `export const environment = {
  production: ${production},
  mapbox: {
    apiKey:
      '${apiKey}',
  },
};
`;

writeFile(targetPath, envConfigFile, 'utf8', err => {
  if (err) {
    return console.log(err);
  }
});
