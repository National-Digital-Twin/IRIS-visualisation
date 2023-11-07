# C477 DBT Visualisation

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.9.

- [Jest](https://jestjs.io/)
- [Cypress](https://cypress.io/)
- [ES Lint](https://eslint.org)
- [Prettier](https://prettier.io)
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary)
- [Compodoc](https://compodoc.app/)

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

### Linting & code style

The project uses a combination of [ES Lint](https://eslint.org) & [Prettier](https://prettier.io) to execute code
linting and style checking. Check code linting and style using `npm run lint`

### Docker

Run `docker build -t c477-vis .` to build the image

The application uses environment specific configuration.

To test the `qa` configuration run:

- `docker run -p 80:80 --env ARUP_ENV=qa c477-vis` and view at http://localhost/

To test the `prod` configuration run:

- `docker run -p 80:80 --env ARUP_ENV=prod c477-vis` and view at http://localhost/

### Code commit messages

The project enforces the use of [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary). This forces consistent commit message format and allows the generation of a [Changelog](./CHANGELOG.md) during the release process.

### Documentation

Run `npm run compodoc` to generate and view app documentation using [Compodoc](https://compodoc.app/).

When writing documentation use the JSDoc format:

- [Comments](https://compodoc.app/guides/comments.html)
- [Tags](https://compodoc.app/guides/jsdoc-tags.html)
