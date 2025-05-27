import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { promises as fsPromises } from "fs"

export async function GET() {
  try {
    const sourcePath = path.join(process.cwd(), "data/experiments.json")
    const targetPath = path.join(process.cwd(), "data/ab.json")

    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      return NextResponse.json(
        {
          success: false,
          message: "Source file not found. Please upload the ab.json file.",
        },
        { status: 404 },
      )
    }

    // Ensure target directory exists
    await fsPromises.mkdir(path.dirname(targetPath), { recursive: true })

    // Read source file
    const content = await fsPromises.readFile(sourcePath, "utf-8")

    // Validate JSON
    try {
      JSON.parse(content)
    } catch (jsonError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON in source file.",
        },
        { status: 400 },
      )
    }

    // Copy file
    await fsPromises.writeFile(targetPath, content, "utf-8")

    return NextResponse.json({
      success: true,
      message: "Successfully initialized ab.json from uploaded file.",
    })
  } catch (error) {
    console.error("Error initializing ab.json:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
