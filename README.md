# README  

**Repository:** `IRIS-visualisation`  
**Description:** `This repository functions as the client side of IRIS and contains frontend views and logic.`  
**SPDX-License-Identifier:** `Apache-2.0 AND OGL-UK-3.0 `  

## Overview  
This repository contributes to the development of **secure, scalable, and interoperable data-sharing infrastructure**. It supports NDTP’s mission to enable **trusted, federated, and decentralised** data-sharing across organisations.  

This repository is one of several open-source components that underpin NDTP’s **Integration Architecture (IA)**—a framework designed to allow organisations to manage and exchange data securely while maintaining control over their own information. The IA is actively deployed and tested across multiple sectors, ensuring its adaptability and alignment with real-world needs.  

## Prerequisites  
Before using this repository, ensure you have the following dependencies installed:  
- **Required Tooling:** NVM, Angular CLI

## Quick Start  
Follow these steps to get started quickly with this repository. For detailed installation, configuration, and deployment, refer to the relevant MD files.  

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

## Features  
Include a brief list of key features provided by this repository. These should highlight what makes the project valuable to users and contributors. Examples of features might include:  
- **Core functionality** Allows the visualisation of housing data on a map interface including materials + EPC ratings.
- **Scalability & performance** Code optimised for scalability and performance.

## Public Funding Acknowledgment  
This repository has been developed with public funding as part of the National Digital Twin Programme (NDTP), a UK Government initiative. NDTP, alongside its partners, has invested in this work to advance open, secure, and reusable digital twin technologies for any organisation, whether from the public or private sector, irrespective of size.  

## License  
This repository contains both source code and documentation, which are covered by different licenses:  
- **Code:** Originally developed by Ovi Arup & Partners and Informed Solutions, now maintained by National Digital Twin Programme. Licensed under the Apache License 2.0.  
- **Documentation:** Licensed under the Open Government Licence v3.0.  

See `LICENSE.md`, `OGL_LICENCE.md`, and `NOTICE.md` for details.  

## Security and Responsible Disclosure  
We take security seriously. If you believe you have found a security vulnerability in this repository, please follow our responsible disclosure process outlined in `SECURITY.md`.  

## Contributing  
We welcome contributions that align with the Programme’s objectives. Please read our `CONTRIBUTING.md` guidelines before submitting pull requests.  

## Acknowledgements  
This repository has benefited from collaboration with various organisations. For a list of acknowledgments, see `ACKNOWLEDGEMENTS.md`.  

## Support and Contact  
For questions or support, check our Issues or contact the NDTP team on ndtp@businessandtrade.gov.uk.

**Maintained by the National Digital Twin Programme (NDTP).**  

© Crown Copyright 2025. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.