import { NextResponse } from "next/server"
import { ExperimentService } from "@/lib/experiments"

export async function GET() {
  try {
    const experimentService = new ExperimentService()
    const experiments = await experimentService.getExperiments()
    return NextResponse.json(experiments)
  } catch (error) {
    console.error("API error in GET /api/experiments:", error)

    // Check if it's a JSON parsing error
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const isJsonError = errorMessage.includes("JSON") || errorMessage.includes("json")

    return NextResponse.json(
      {
        error: "Failed to fetch experiments",
        message: isJsonError
          ? "The experiments file contained invalid JSON and has been reset to defaults. Please refresh the page."
          : errorMessage,
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
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const experiment = await request.json()
    const experimentService = new ExperimentService()
    const result = await experimentService.createExperiment(experiment)
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
