export interface GitlabPushEvent {
  project: {
    path_with_namespace: string
  }
  repository: {
    git_http_url: string
  }
}

export interface DeployConfig {
  path: {
    dist: string
    html: string
  }
  scripts: string[]
}