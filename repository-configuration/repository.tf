resource "github_repository" "repository" {
  name                   = basename(dirname(path.cwd))
  description            = var.repository_description
  visibility             = "private"
  delete_branch_on_merge = false
  has_downloads          = true
  has_issues             = true
  has_projects           = true
}

resource "github_branch_protection" "develop_branch_protection" {
  repository_id = github_repository.repository.node_id
  pattern       = "develop"

  required_pull_request_reviews {
    required_approving_review_count = 1
  }

  required_status_checks {
    contexts = []
    strict   = true
  }
}

resource "github_branch_protection" "release_branch_protection" {
  repository_id = github_repository.repository.node_id
  pattern       = "release/*"
}

resource "github_branch_protection" "main_branch_protection" {
  repository_id = github_repository.repository.node_id
  pattern       = "main"

  required_pull_request_reviews {
    required_approving_review_count = 1
  }

  required_status_checks {
    contexts = []
    strict   = true
  }
}
