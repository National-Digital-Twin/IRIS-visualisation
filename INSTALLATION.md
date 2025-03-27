# INSTALLATION  

**Repository:** `IRIS-visualisation`  
**Description:** `Details how to install and run the software`  
**SPDX-License-Identifier:** `Apache-2.0 AND OGL-UK-3.0 ` 

## Prerequisites  
Before using this repository, ensure you have the following dependencies installed:  
- **Required Tooling:** NVM, Angular CLI

### 1. Download 
```sh  
git clone https://github.com/IRIS-visualisation.git  
cd IRIS-visualisation
```

### 2. Install Dependencies  
It is recommended to use `nvm` to manage versions of node, this project has been setup with an `.nvmrc` file so make sure to install and use this;

```
nvm install
nvm use
```

Create a personal access token on GitHub - https://github.com/settings/tokens - create a classic token with read:packages permission store this safely and make sure to add as an environment variable;

```
export GITHUB_ACCESS_TOKEN=ghp_xxxxxxx
```

You should now be able to run the usual install

```
npm install
```

### 3. Configuration  

For local development, create a `environment.local.ts` file in `environments` and a `\local\config.json` directory & file in `configurations`. These two files should have the same structure as the existing environment files. These local files are not committed to git, and can have any secret keys added safely.

Create a file called `environments\keys.environment.ts` and add your Mapbox API key and OS Data Hub API key. This file will not be committed to the code repository.

```
export const apiKeys = {
  mapbox: {
    apiKey:
      'your mapbox api key',
  },
  os: {
    apiKey: 'your os data hub api key',
  },
};
```

Run `npm start` for a dev server using the `local` app configuration. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

The application also provides npm scripts for running a development server that will load the corresponding environment configuration.

```npm
npm run start
npm run start:dev
npm run start:qa
npm run start:prod
```

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Linting & code style

The project uses a combination of [ES Lint](https://eslint.org) & [Prettier](https://prettier.io) to execute code
linting and style checking. Check code linting and style using `npm run lint`


© Crown Copyright 2025. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.  
Licensed under the Open Government Licence v3.0.  
For full licensing terms, see [OGL_LICENSE.md](OGL_LICENSE.md).  