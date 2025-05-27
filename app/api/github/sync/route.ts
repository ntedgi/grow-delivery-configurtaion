import { NextResponse } from "next/server"
import { ExperimentService } from "@/lib/experiments"

export async function POST() {
  try {
    const experimentService = new ExperimentService()

    // Check if GitHub is configured
    if (!experimentService.isGitHubConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: "GitHub integration not configured. Using local file only.",
        },
        { status: 400 },
      )
    }

    const experiments = await experimentService.getExperiments()
    await experimentService.saveExperiments(experiments)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to sync with GitHub" }, { status: 500 })
  }
}
