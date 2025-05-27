import { NextResponse } from "next/server"
import { ExperimentService } from "@/lib/experiments"

export async function POST() {
  try {
    const experimentService = new ExperimentService()

    // Check if GitHub is configured
    const isConfigured = await experimentService.isGitHubConfigured()

    if (!isConfigured) {
      console.log("GitHub integration not configured, returning appropriate message")
      return NextResponse.json(
        {
          success: false,
          message: "GitHub integration not configured. Using local storage only.",
        },
        { status: 200 }, // Changed from 400 to 200 to avoid triggering error handling
      )
    }

    console.log("GitHub is configured, attempting to sync")
    const experiments = await experimentService.getExperiments()
    await experimentService.saveExperiments(experiments)

    return NextResponse.json({
      success: true,
      message: "Successfully synced with GitHub",
    })
  } catch (error) {
    console.error("Error in GitHub sync endpoint:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync with GitHub",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
