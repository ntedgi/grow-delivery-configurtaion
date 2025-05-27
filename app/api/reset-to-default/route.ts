import { NextResponse } from "next/server"
import { ExperimentService } from "@/lib/experiments"
import { DEFAULT_AB_DATA } from "@/lib/default-data"

export async function GET() {
  try {
    const experimentService = new ExperimentService()

    // Save the default data
    await experimentService.saveExperiments(DEFAULT_AB_DATA as any)

    return NextResponse.json({
      success: true,
      message: "Successfully reset to default configuration.",
    })
  } catch (error) {
    console.error("Error resetting to default:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
