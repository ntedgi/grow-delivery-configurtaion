import { NextResponse } from "next/server"
import { ExperimentService } from "@/lib/experiments"

export async function POST(request: Request) {
  try {
    const { experimentId } = await request.json()

    if (!experimentId) {
      return NextResponse.json(
        {
          error: "Missing experimentId",
          message: "Experiment ID is required",
        },
        { status: 400 },
      )
    }

    const experimentService = new ExperimentService()
    const result = await experimentService.deleteExperiment(experimentId)

    return NextResponse.json(result)
  } catch (error) {
    console.error("API error in POST /api/experiments/delete:", error)
    return NextResponse.json(
      {
        error: "Failed to delete experiment",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
