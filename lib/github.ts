import { Octokit } from "octokit"
import fs from "fs"
import path from "path"
import { promises as fsPromises } from "fs"

// Use the correct path for Next.js
const LOCAL_FILE_PATH = path.join(process.cwd(), "data/experiments.json")
const BACKUP_FILE_PATH = path.join(process.cwd(), "data/experiments.backup.json")

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

  private getDefaultContent(): string {
    return JSON.stringify(
      {
        experiments: [],
        defaultConfig: {
          description: "Default description",
          enabled: false,
          traffic: 0,
          variants: [
            { name: "Control", traffic: 50 },
            { name: "Treatment", traffic: 50 },
          ],
        },
      },
      null,
      2,
    )
  }

  async getFileContent(): Promise<string> {
    try {
      // Ensure the directory exists
      await this.ensureDirectoryExists(path.dirname(LOCAL_FILE_PATH))

      // Check if file exists
      if (!fs.existsSync(LOCAL_FILE_PATH)) {
        console.log("Experiments file not found, creating default file")
        const defaultContent = this.getDefaultContent()
        await fsPromises.writeFile(LOCAL_FILE_PATH, defaultContent, "utf-8")
        return defaultContent
      }

      // Read the file
      let content: string
      try {
        content = await fsPromises.readFile(LOCAL_FILE_PATH, "utf-8")
      } catch (readError) {
        console.error("Error reading file:", readError)
        const defaultContent = this.getDefaultContent()
        await fsPromises.writeFile(LOCAL_FILE_PATH, defaultContent, "utf-8")
        return defaultContent
      }

      // Check if content is empty
      if (!content || content.trim() === "") {
        console.log("File is empty, creating default content")
        const defaultContent = this.getDefaultContent()
        await fsPromises.writeFile(LOCAL_FILE_PATH, defaultContent, "utf-8")
        return defaultContent
      }

      // Validate JSON
      try {
        const parsed = JSON.parse(content)

        // Validate structure
        if (!parsed || typeof parsed !== "object") {
          throw new Error("Invalid JSON structure")
        }

        // Ensure required fields exist
        if (!Array.isArray(parsed.experiments)) {
          parsed.experiments = []
        }

        if (!parsed.defaultConfig) {
          parsed.defaultConfig = {
            description: "Default description",
            enabled: false,
            traffic: 0,
            variants: [
              { name: "Control", traffic: 50 },
              { name: "Treatment", traffic: 50 },
            ],
          }
        }

        // Save the corrected structure if we made changes
        const correctedContent = JSON.stringify(parsed, null, 2)
        if (correctedContent !== content) {
          await fsPromises.writeFile(LOCAL_FILE_PATH, correctedContent, "utf-8")
          return correctedContent
        }

        return content
      } catch (jsonError) {
        console.error("Invalid JSON in file:", jsonError)
        console.log("Content preview:", content.substring(0, 100))

        // Backup the invalid file
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
          const backupPath = path.join(process.cwd(), "data", `experiments.invalid.${timestamp}.txt`)
          await fsPromises.writeFile(backupPath, content, "utf-8")
          console.log(`Backed up invalid file to: ${backupPath}`)
        } catch (backupError) {
          console.error("Failed to backup invalid file:", backupError)
        }

        // Replace with default content
        const defaultContent = this.getDefaultContent()
        await fsPromises.writeFile(LOCAL_FILE_PATH, defaultContent, "utf-8")
        console.log("Replaced invalid JSON with default content")
        return defaultContent
      }
    } catch (error) {
      console.error("Error in getFileContent:", error)

      // Try GitHub as fallback if configured
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
              await this.ensureDirectoryExists(path.dirname(LOCAL_FILE_PATH))
              await fsPromises.writeFile(LOCAL_FILE_PATH, content, "utf-8")
              console.log("Successfully fetched and saved content from GitHub")
              return content
            } catch (githubJsonError) {
              console.error("Invalid JSON from GitHub:", githubJsonError)
            }
          }
        } catch (githubError) {
          console.error("Error fetching from GitHub:", githubError)
        }
      }

      // Return default content as last resort
      const defaultContent = this.getDefaultContent()
      try {
        await this.ensureDirectoryExists(path.dirname(LOCAL_FILE_PATH))
        await fsPromises.writeFile(LOCAL_FILE_PATH, defaultContent, "utf-8")
      } catch (writeError) {
        console.error("Failed to write default content:", writeError)
      }
      return defaultContent
    }
  }

  async saveFileContent(content: string): Promise<void> {
    try {
      // Ensure the directory exists
      await this.ensureDirectoryExists(path.dirname(LOCAL_FILE_PATH))

      // Validate JSON before saving
      try {
        const parsed = JSON.parse(content)
        if (!parsed || typeof parsed !== "object") {
          throw new Error("Invalid JSON structure")
        }
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
