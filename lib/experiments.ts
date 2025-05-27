import type { Experiment, ExperimentsConfig } from "@/types/experiment"
import { GitHubService } from "./github"
import * as diff from "diff"

export class ExperimentService {
  private githubService: GitHubService

  constructor() {
    this.githubService = new GitHubService()
  }

  async getExperiments(): Promise<ExperimentsConfig> {
    try {
      const content = await this.githubService.getFileContent()
      const config = JSON.parse(content)

      // Ensure the config has the expected structure
      if (!config.default) {
        throw new Error("Missing default configuration")
      }

      if (!config.experiments) {
        config.experiments = []
      }

      if (!config.filters) {
        config.filters = []
      }

      return config
    } catch (error) {
      console.error("Error in getExperiments:", error)
      throw error
    }
  }

  async createExperiment(experiment: Partial<Experiment>): Promise<{
    config: ExperimentsConfig
    diff: string
  }> {
    try {
      const currentConfig = await this.getExperiments()

      const oldContent = JSON.stringify(currentConfig, null, 2)

      // Create a complete experiment object
      const newExperiment: Experiment = {
        landingID: experiment.landingID || Date.now(),
        landingName: experiment.landingName || "New Experiment",
        enabled: experiment.enabled ?? false,
        userClusters: experiment.userClusters || [],
        toggles: experiment.toggles || {},
        sdkToggles: experiment.sdkToggles || {},
      }

      // Ensure experiments array exists
      if (!currentConfig.experiments) {
        currentConfig.experiments = []
      }

      currentConfig.experiments.push(newExperiment)
      const newContent = JSON.stringify(currentConfig, null, 2)

      // Save the changes locally
      await this.saveExperiments(currentConfig)

      const diffResult = diff.createPatch("experiments.json", oldContent, newContent, "Before", "After")

      return {
        config: currentConfig,
        diff: diffResult,
      }
    } catch (error) {
      console.error("Error in createExperiment:", error)
      throw error
    }
  }

  async saveExperiments(config: ExperimentsConfig): Promise<void> {
    try {
      const content = JSON.stringify(config, null, 2)
      await this.githubService.saveFileContent(content)
    } catch (error) {
      console.error("Error in saveExperiments:", error)
      throw error
    }
  }

  async createPullRequest(config: ExperimentsConfig, message: string): Promise<string> {
    try {
      const content = JSON.stringify(config, null, 2)
      return this.githubService.createPullRequest(content, message)
    } catch (error) {
      console.error("Error in createPullRequest:", error)
      throw error
    }
  }

  isGitHubConfigured(): boolean {
    return this.githubService.isGitHubConfigured()
  }
}
