import type { Experiment, ExperimentsConfig } from "@/types/experiment"
import * as diff from "diff"

// Dynamically import the appropriate GitHub service based on environment
const getGitHubService = async () => {
  // Check if we're in a production environment without file system access
  if (process.env.NODE_ENV === "production" && !process.env.GITHUB_TOKEN) {
    const { GitHubService } = await import("./github-simple")
    return new GitHubService()
  } else {
    const { GitHubService } = await import("./github")
    return new GitHubService()
  }
}

export class ExperimentService {
  private githubServicePromise: Promise<any>

  constructor() {
    this.githubServicePromise = getGitHubService()
  }

  async getExperiments(): Promise<ExperimentsConfig> {
    try {
      const githubService = await this.githubServicePromise
      const content = await githubService.getFileContent()
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

      // Save the changes
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

  async updateExperiment(updatedExperiment: Experiment): Promise<{
    config: ExperimentsConfig
    diff: string
  }> {
    try {
      const currentConfig = await this.getExperiments()
      const oldContent = JSON.stringify(currentConfig, null, 2)

      // Find the experiment to update
      const experimentIndex = currentConfig.experiments.findIndex(
        (exp) => exp.landingID === updatedExperiment.landingID,
      )

      if (experimentIndex === -1) {
        throw new Error(`Experiment with ID ${updatedExperiment.landingID} not found`)
      }

      // Update the experiment
      currentConfig.experiments[experimentIndex] = updatedExperiment

      const newContent = JSON.stringify(currentConfig, null, 2)

      // Save the changes
      await this.saveExperiments(currentConfig)

      const diffResult = diff.createPatch("experiments.json", oldContent, newContent, "Before", "After")

      return {
        config: currentConfig,
        diff: diffResult,
      }
    } catch (error) {
      console.error("Error in updateExperiment:", error)
      throw error
    }
  }

  async deleteExperiment(experimentId: number): Promise<{
    config: ExperimentsConfig
    diff: string
  }> {
    try {
      const currentConfig = await this.getExperiments()
      const oldContent = JSON.stringify(currentConfig, null, 2)

      // Find the experiment to delete
      const experimentIndex = currentConfig.experiments.findIndex((exp) => exp.landingID === experimentId)

      if (experimentIndex === -1) {
        throw new Error(`Experiment with ID ${experimentId} not found`)
      }

      // Remove the experiment
      currentConfig.experiments.splice(experimentIndex, 1)

      const newContent = JSON.stringify(currentConfig, null, 2)

      // Save the changes
      await this.saveExperiments(currentConfig)

      const diffResult = diff.createPatch("experiments.json", oldContent, newContent, "Before", "After")

      return {
        config: currentConfig,
        diff: diffResult,
      }
    } catch (error) {
      console.error("Error in deleteExperiment:", error)
      throw error
    }
  }

  async saveExperiments(config: ExperimentsConfig): Promise<void> {
    try {
      const githubService = await this.githubServicePromise
      const content = JSON.stringify(config, null, 2)
      await githubService.saveFileContent(content)
    } catch (error) {
      console.error("Error in saveExperiments:", error)
      throw error
    }
  }

  async createPullRequest(config: ExperimentsConfig, message: string): Promise<string> {
    try {
      const githubService = await this.githubServicePromise
      const content = JSON.stringify(config, null, 2)
      return githubService.createPullRequest(content, message)
    } catch (error) {
      console.error("Error in createPullRequest:", error)
      throw error
    }
  }

  async isGitHubConfigured(): Promise<boolean> {
    const githubService = await this.githubServicePromise
    return githubService.isGitHubConfigured()
  }
}
