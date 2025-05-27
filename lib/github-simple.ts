import { DEFAULT_AB_DATA } from "./default-data"
import type { ExperimentsConfig } from "@/types/experiment"

// Simple in-memory storage for the deployed version
let inMemoryData: ExperimentsConfig | null = null

export class GitHubService {
  constructor() {
    // Initialize with default data if not already set
    if (!inMemoryData) {
      inMemoryData = DEFAULT_AB_DATA as ExperimentsConfig
    }
  }

  async getFileContent(): Promise<string> {
    // Always return the in-memory data
    return JSON.stringify(inMemoryData, null, 2)
  }

  async saveFileContent(content: string): Promise<void> {
    try {
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
    // Save to memory first
    await this.saveFileContent(content)
    return "Changes saved locally (GitHub integration not configured)"
  }

  isGitHubConfigured(): boolean {
    // Always return false for the simple version
    return false
  }
}
