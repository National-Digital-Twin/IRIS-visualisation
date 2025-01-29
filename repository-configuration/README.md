# GitHub Repository Configuration

This directory holds [OpenTofu] (https://opentofu.org/) resources for managing this repository's branch protection settings. To authenticate the GitHub provider, the following environment variable must be set to a valid access token:

`export TF_VAR_token=<<GitHub access token>>`

These resources apply branch protection policies consistent with the use of a [GitFlow] (https://www.gitkraken.com/learn/git/git-flow) branching strategy. Given a repository may be in varying states of maturity, branches are not in themselves created programatically. It is assumed develop, release/* and main branches already exist. If they do not, you can still apply these resources and later can create the target branches manually in your repository.

## State Management
The OpenTofu resources in this directory do not produce a statefile containing sensitive content or secrets. To avoid a need to store state in a remote (that may require access controls), the small statefile is managed via the repository itself. If you make changes to these resources that means sensitive values are persisted to the statefile, you will need to look at remote state management options (e.g., S3).

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