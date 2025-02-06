## Running Sonar scan locally

Listed below are the steps to run a Sonar scan locally for this repository

:large_blue_circle: All of the Make commands given below can be run without using Make by copying the relevant command in the make file and running it in a terminal.

### Setting up Sonarqube

First you are going to need to setup Sonarqube locally to do this run the following command

```
make sonarqube-up
```

This will pull down the container image for Sonarqube 25.1.0.102122-community from Dockerhub and run it locally. This can be accessed on the URL `locahost:9000`.

When you navigate to this URL it is going to ask for the username and password which by default (when you are running this service for the first time) are `admin` and `admin`. It will then prompt you to change the password to a more secure one.

Once you have completed this step you will be greeted with the "How do you want to create your project?" screen. Please select the "Create a local project" option. Select a project display name, project key and Main branch name (usually develop as most feature/bug branches will be merge there). On the next screen select the "Use global setting" option as this will suffice for now. Finally click on the "create project" button which should create the project for you. Do this process for all the different parts of this repository so that your scans can be isolated.

### Running your first scan

As a general guideline it is recommended to run the first scan on the update main line branch for your code as this will act as the baseline. For the first time after creating your project you will be presented with the "Analysis Method" screen. Please select the "Locally" option. On the next screen keep the "Generate a project token" and set an appropriate expiry for it (since this is locally you can set it to No expiration). _Please copy this token as you will need it for later scans_

Run the following command replacing the parameters with the appropriate values

```
make run-sonar-scan SONAR_PROJECT_KEY=test SONAR_TOKEN=test TEST_DIR=test
```

The SONAR_PROJECT_KEY is the key of the project you have setup for the repository.
The SONAR_TOKEN is the token displayed on the screen when you click the "Generate" button.
The TEST_DIR is the directory which contains the tests for the repository you wish to scan.

Once the scan is complete the page should refresh and display the current the project overview screen with the results from the scan.

### Running subsequent scans

To run subsequent scans simply use the same token that you generated and stored in an appropriate place for your project and run the command given in the "Running your first scan section".

### Generating a new token

To generate a new token navigate to Administration > Security > Users. Then click on the 3 dots next to the tokens field. Here you can revoke your previous token or provide a token name and generate a new one. As always when generating a new one make sure to copy and store this somewhere appropriate as you are going to be running subsequent scans using this.

## Additional notes

The current quality gate is set to the Sonarqube default which is the "clean code as you go" approach more information about it can be found [here](https://docs.sonarsource.com/sonarqube-community-build/core-concepts/clean-as-you-code/introduction/).

:warning: Please be aware that with this approach the scan will pass if your new code itself does not introduce issues. For the purpose of the project a code coverage and quality of 80% is to be followed.
