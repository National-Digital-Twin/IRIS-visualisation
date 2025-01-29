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
  default     = "Private repo for IRIS, a 3D mapping tool visualising domestic properties and EPC data, developed for NDTP, by Arup. Built on Mapbox with JavaScript."
}