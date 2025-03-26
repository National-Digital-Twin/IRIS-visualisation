# Project Overview

IRIS is a digital tool designed to support data-driven decision-making for retrofitting domestic properties by identifying homes that could benefit from energy efficiency improvements. It enables stakeholders to assess housing stock based on energy performance data to help target funding schemes and policy interventions more effectively

# Repository Description

This repository functions as the client side of IRIS and contains frontend views and logic.

# C477 DBT Visualisation

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.0.0.

- [ES Lint](https://eslint.org)
- [Prettier](https://prettier.io)
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary)
- [Compodoc](https://compodoc.app/)

## Development server

#### Install dependencies

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

#### Configuration

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

## Running local code development tools

See [RUNNING_CODE_DEV_TOOLS.md](./developer_docs/RUNNING_CODE_DEV_TOOLS.md) for more information.

## Code commit messages

The project enforces the use of [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary). This forces consistent commit message format and allows the generation of a [Changelog](./CHANGELOG.md) during the release process.

## Documentation

Run `npm run compodoc` to generate and view app documentation using [Compodoc](https://compodoc.app/).

When writing documentation use the JSDoc format:

- [Comments](https://compodoc.app/guides/comments.html)
- [Tags](https://compodoc.app/guides/jsdoc-tags.html)

## Contributors
The development of these works has been made possible with thanks to our [contributors](https://github.com/National-Digital-Twin/IRIS-visualisation/graphs/contributors).
