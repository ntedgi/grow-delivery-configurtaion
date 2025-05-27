import { DEFAULT_AB_DATA } from "./default-data"
import type { ExperimentsConfig } from "@/types/experiment"

// Simple in-memory storage for the deployed version
let inMemoryData: ExperimentsConfig | null = null

export class GitHubService {
  constructor() {
    console.log("Initializing GitHubService (simple version)")
    // Initialize with default data if not already set
    if (!inMemoryData) {
      console.log("Setting initial in-memory data from DEFAULT_AB_DATA")
      inMemoryData = JSON.parse(JSON.stringify(DEFAULT_AB_DATA)) as ExperimentsConfig
    }
  }

  async getFileContent(): Promise<string> {
    console.log("Getting file content from in-memory data")
    // Always return the in-memory data
    if (!inMemoryData) {
      console.log("In-memory data not found, using DEFAULT_AB_DATA")
      inMemoryData = JSON.parse(JSON.stringify(DEFAULT_AB_DATA)) as ExperimentsConfig
    }
    return JSON.stringify(inMemoryData, null, 2)
  }

  async saveFileContent(content: string): Promise<void> {
    try {
      console.log("Saving content to in-memory data")
      // Validate JSON before saving
      const parsed = JSON.parse(content) as ExperimentsConfig
      inMemoryData = parsed
      console.log("Successfully saved experiments to memory")
    } catch (error) {
      console.error("Error saving content:", error)
      throw new Error("Failed to save experiments: Invalid JSON")
    }
  }

  async createPullRequest(content: string, message: string): Promise<string> {
    console.log("Creating 'pull request' (saving to memory)")
    // Save to memory first
    await this.saveFileContent(content)
    return "Changes saved locally (GitHub integration not configured)"
  }

  isGitHubConfigured(): boolean {
    console.log("Checking if GitHub is configured (always false for simple version)")
    // Always return false for the simple version
    return false
  }
}
