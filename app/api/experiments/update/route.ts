import { NextResponse } from "next/server"
import { ExperimentService } from "@/lib/experiments"

export async function POST(request: Request) {
  try {
    const experiment = await request.json()
    const experimentService = new ExperimentService()
    const result = await experimentService.updateExperiment(experiment)
    return NextResponse.json(result)
  } catch (error) {
    console.error("API error in POST /api/experiments/update:", error)
    return NextResponse.json(
      {
        error: "Failed to update experiment",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
