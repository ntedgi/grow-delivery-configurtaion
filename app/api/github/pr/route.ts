import { NextResponse } from "next/server"
import { ExperimentService } from "@/lib/experiments"

export async function POST(request: Request) {
  try {
    const { config, message } = await request.json()
    const experimentService = new ExperimentService()

    // Check if GitHub is configured
    const isConfigured = await experimentService.isGitHubConfigured()
    if (!isConfigured) {
      await experimentService.saveExperiments(config)
      return NextResponse.json({
        prUrl: null,
        message: "GitHub integration not configured. Changes saved locally.",
      })
    }

    const prUrl = await experimentService.createPullRequest(config, message)
    return NextResponse.json({ prUrl })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create pull request" }, { status: 500 })
  }
}
