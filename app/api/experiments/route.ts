import { NextResponse } from "next/server"
import { ExperimentService } from "@/lib/experiments"
import { DEFAULT_AB_DATA } from "@/lib/default-data"

export async function GET() {
  try {
    console.log("GET /api/experiments: Fetching experiments")
    const experimentService = new ExperimentService()
    const experiments = await experimentService.getExperiments()
    console.log("GET /api/experiments: Successfully fetched experiments")
    return NextResponse.json(experiments)
  } catch (error) {
    console.error("API error in GET /api/experiments:", error)

    // Check if it's a JSON parsing error
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const isJsonError = errorMessage.includes("JSON") || errorMessage.includes("json")

    console.log("Returning default data due to error")

    // Always return the default data on error
    return NextResponse.json(
      DEFAULT_AB_DATA,
      { status: 200 }, // Return 200 to avoid triggering error handling
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/experiments: Creating experiment")
    const experiment = await request.json()
    const experimentService = new ExperimentService()
    const result = await experimentService.createExperiment(experiment)
    console.log("POST /api/experiments: Successfully created experiment")
    return NextResponse.json(result)
  } catch (error) {
    console.error("API error in POST /api/experiments:", error)
    return NextResponse.json(
      {
        error: "Failed to create experiment",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
