# GitHub Repository Configuration

This directory holds [OpenTofu](https://opentofu.org/) resources for managing this repository's branch protection settings. To authenticate the GitHub provider, the following environment variable must be set to a valid access token:

`export TF_VAR_token=<<GitHub access token>>`

These resources apply branch protection policies consistent with the use of a [GitFlow](https://nvie.com/posts/a-successful-git-branching-model/) branching strategy. Given a repository may be in varying states of maturity, branches are not in themselves created programmatically. It is assumed develop, release/* and main branches already exist. If they do not, you can still apply these resources and later can create the target branches manually in your repository.

A second variable that must be supplied is that of your requirement tracking system. As an example, if the link to see the original issue or requirement was to be linked to https://example.com/requirement-system/DPAV-142, you would set this variable to "https://example.com/requirement-system" using the below command:

`export TF_VAR_requirement_tracking_url_base=https://example.com/requirement-system`

Once environment variables have been been set, you can initialise OpenTofu by running `tofu init`, followed by `tofu apply` to apply the configuration. If you are working on an existing repository, you must import the repository and any existing protection rules using the commands in the Importing existing resources section.

## Importing existing resources

If you are retrospectively applying these resources to manage an existing repository, the below import commands can be used. For information about the import commands themselves please see:

* https://registry.terraform.io/providers/integrations/github/latest/docs/resources/repository
* https://registry.terraform.io/providers/integrations/github/latest/docs/resources/branch_protection.

```
export REPOSITORY_NAME=<<replace with name of repository>>
tofu import github_repository.repository $REPOSITORY_NAME
tofu import github_branch_protection.develop_branch_protection $REPOSITORY_NAME:develop
tofu import github_branch_protection.release_branch_protection $REPOSITORY_NAME:release/*
tofu import github_branch_protection.main_branch_protection $REPOSITORY_NAME:main
```