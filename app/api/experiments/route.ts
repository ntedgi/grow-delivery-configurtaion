import { NextResponse } from "next/server"
import { ExperimentService } from "@/lib/experiments"
import fs from "fs"
import path from "path"
import { promises as fsPromises } from "fs"

export async function GET() {
  try {
    // First, ensure the uploaded JSON is copied to ab.json
    const sourcePath = path.join(process.cwd(), "data/experiments.json")
    const targetPath = path.join(process.cwd(), "data/ab.json")

    // If the source file exists but target doesn't, copy it
    if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
      try {
        const content = await fsPromises.readFile(sourcePath, "utf-8")
        // Validate JSON
        JSON.parse(content)
        // Ensure directory exists
        await fsPromises.mkdir(path.dirname(targetPath), { recursive: true })
        // Copy to ab.json
        await fsPromises.writeFile(targetPath, content, "utf-8")
        console.log("Copied uploaded JSON file to ab.json")
      } catch (copyError) {
        console.error("Error copying uploaded file:", copyError)
      }
    }

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
