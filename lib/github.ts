import { Octokit } from "octokit"
import fs from "fs"
import path from "path"
import { promises as fsPromises } from "fs"

// Use the correct paths for Next.js
const LOCAL_FILE_PATH = path.join(process.cwd(), "data/ab.json")
const DEFAULT_FILE_PATH = path.join(process.cwd(), "data/default-ab.json")
const BACKUP_FILE_PATH = path.join(process.cwd(), "data/ab.backup.json")

export class GitHubService {
  private octokit: Octokit | null = null
  private owner = ""
  private repo = ""
  private filePath = "experiments.json"

  constructor() {
    // Only initialize GitHub if environment variables are available
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
      this.octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
      })
      this.owner = process.env.GITHUB_OWNER
      this.repo = process.env.GITHUB_REPO
    }
  }

  async getFileContent(): Promise<string> {
    try {
      // Ensure the directory exists
      await this.ensureDirectoryExists(path.dirname(LOCAL_FILE_PATH))

      // Check if local file exists
      if (fs.existsSync(LOCAL_FILE_PATH)) {
        try {
          const content = await fsPromises.readFile(LOCAL_FILE_PATH, "utf-8")

          // Validate JSON
          try {
            JSON.parse(content)
            return content
          } catch (jsonError) {
            console.error("Invalid JSON in local file:", jsonError)
            // If invalid JSON, continue to fallbacks
          }
        } catch (readError) {
          console.error("Error reading local file:", readError)
          // Continue to fallbacks
        }
      }

      // If local file doesn't exist or has invalid JSON, use the default file
      if (fs.existsSync(DEFAULT_FILE_PATH)) {
        try {
          console.log("Using default AB test configuration file")
          const content = await fsPromises.readFile(DEFAULT_FILE_PATH, "utf-8")

          // Validate JSON
          try {
            JSON.parse(content)

            // Copy to the local file path
            await fsPromises.writeFile(LOCAL_FILE_PATH, content, "utf-8")
            console.log("Copied default configuration to local file")

            return content
          } catch (jsonError) {
            console.error("Invalid JSON in default file:", jsonError)
            // If default file has invalid JSON, continue to GitHub fallback
          }
        } catch (readError) {
          console.error("Error reading default file:", readError)
          // Continue to GitHub fallback
        }
      }

      // Try GitHub as fallback only if configured
      if (this.octokit && this.owner && this.repo) {
        try {
          console.log("Attempting to fetch from GitHub...")
          const { data } = await this.octokit.rest.repos.getContent({
            owner: this.owner,
            repo: this.repo,
            path: this.filePath,
            ref: "master",
          })

          if ("content" in data && typeof data.content === "string") {
            const content = Buffer.from(data.content, "base64").toString("utf-8")

            // Validate the GitHub content
            try {
              JSON.parse(content)
              await fsPromises.writeFile(LOCAL_FILE_PATH, content, "utf-8")
              console.log("Successfully fetched and saved content from GitHub")
              return content
            } catch (githubJsonError) {
              console.error("Invalid JSON from GitHub:", githubJsonError)
              // If GitHub content has invalid JSON, continue to final fallback
            }
          }
        } catch (githubError) {
          console.error("Error fetching from GitHub:", githubError)
          // Continue to final fallback
        }
      } else {
        console.log("GitHub not configured, using local file only")
      }

      // Final fallback: create a minimal valid structure
      console.log("Using minimal default structure as last resort")
      const defaultContent = JSON.stringify(
        {
          default: {
            landingID: 10000,
            landingName: "Default Configuration",
            enabled: true,
            toggles: {
              both: {},
              ios: {},
              android: {},
            },
            sdkToggles: {
              both: {},
              ios: {},
              android: {},
            },
          },
          experiments: [],
          filters: [],
        },
        null,
        2,
      )

      await fsPromises.writeFile(LOCAL_FILE_PATH, defaultContent, "utf-8")
      return defaultContent
    } catch (error) {
      console.error("Error in getFileContent:", error)

      // Absolute last resort - return a minimal valid structure
      return JSON.stringify(
        {
          default: {
            landingID: 10000,
            landingName: "Default Configuration",
            enabled: true,
            toggles: { both: {}, ios: {}, android: {} },
            sdkToggles: { both: {}, ios: {}, android: {} },
          },
          experiments: [],
          filters: [],
        },
        null,
        2,
      )
    }
  }

  async saveFileContent(content: string): Promise<void> {
    try {
      // Ensure the directory exists
      await this.ensureDirectoryExists(path.dirname(LOCAL_FILE_PATH))

      // Validate JSON before saving
      try {
        JSON.parse(content)
      } catch (jsonError) {
        console.error("Invalid JSON content:", jsonError)
        throw new Error("Cannot save invalid JSON content")
      }

      // Create a backup of the current file before overwriting
      if (fs.existsSync(LOCAL_FILE_PATH)) {
        try {
          const currentContent = await fsPromises.readFile(LOCAL_FILE_PATH, "utf-8")
          await fsPromises.writeFile(BACKUP_FILE_PATH, currentContent, "utf-8")
        } catch (backupError) {
          console.error("Failed to create backup:", backupError)
        }
      }

      // Save to local file
      await fsPromises.writeFile(LOCAL_FILE_PATH, content, "utf-8")
      console.log("Successfully saved experiments file")
    } catch (error) {
      console.error("Error saving to local file:", error)
      throw new Error("Failed to save experiments file")
    }
  }

  private async ensureDirectoryExists(directory: string): Promise<void> {
    try {
      await fsPromises.mkdir(directory, { recursive: true })
    } catch (error) {
      console.error("Error creating directory:", error)
      throw new Error(`Failed to create directory: ${directory}`)
    }
  }

  async createPullRequest(content: string, message: string): Promise<string> {
    // Save locally first
    await this.saveFileContent(content)

    // If GitHub is not configured, return early
    if (!this.octokit || !this.owner || !this.repo) {
      return "GitHub integration not configured. Changes saved locally."
    }

    try {
      // Create a new branch
      const branchName = `update-experiments-${Date.now()}`

      // Get the SHA of the master branch
      const { data: ref } = await this.octokit.rest.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: "heads/master",
      })

      // Create a new branch
      await this.octokit.rest.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha,
      })

      // Get the current file SHA
      try {
        const { data: fileData } = await this.octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: this.filePath,
          ref: "master",
        })

        const fileSha = "sha" in fileData ? fileData.sha : ""

        // Update the file in the new branch
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path: this.filePath,
          message,
          content: Buffer.from(content).toString("base64"),
          branch: branchName,
          sha: fileSha,
        })
      } catch (error) {
        // File might not exist yet, create it
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path: this.filePath,
          message,
          content: Buffer.from(content).toString("base64"),
          branch: branchName,
        })
      }

      // Create a pull request
      const { data: pr } = await this.octokit.rest.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title: message,
        head: branchName,
        base: "master",
        body: `Automated update: ${message}`,
      })

      return pr.html_url
    } catch (error) {
      console.error("Error creating PR:", error)
      return "Failed to create PR, but changes saved locally."
    }
  }

  isGitHubConfigured(): boolean {
    return !!(this.octokit && this.owner && this.repo)
  }
}
