variable "token" {
  description = "GitHub personal access token."
  type        = string
  sensitive   = true
}

variable "organisation" {
  description = "The GitHub organisation name."
  type        = string
  default     = "National-Digital-Twin"
}

variable "repository_description" {
  description = "GitHub repository description."
  type        = string
  default     = "IRIS is a digital tool for data-driven decision-making in retrofitting homes. It uses energy performance data to identify properties that could benefit from efficiency improvements, helping to target funding and policy actions."
}

variable "requirement_tracking_url_base" {
  description = "Requirement tracking system URL base to be used for autolinking commit messages."
  type        = string
}

variable "requirement_tracking_id" {
  description = "Requirement identifier to be used for autolinking commit messages. This ID should match those which prefix issue identifiers, for example DPAV."
  type        = string
  default     = "DPAV"
}