import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { promises as fsPromises } from "fs"

export async function GET() {
  try {
    const defaultFilePath = path.join(process.cwd(), "data/default-ab.json")
    const targetPath = path.join(process.cwd(), "data/ab.json")

    // Check if default file exists
    if (!fs.existsSync(defaultFilePath)) {
      return NextResponse.json(
        {
          success: false,
          message: "Default configuration file not found.",
        },
        { status: 404 },
      )
    }

    // Ensure target directory exists
    await fsPromises.mkdir(path.dirname(targetPath), { recursive: true })

    // Read default file
    const content = await fsPromises.readFile(defaultFilePath, "utf-8")

    // Validate JSON
    try {
      JSON.parse(content)
    } catch (jsonError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON in default file.",
        },
        { status: 400 },
      )
    }

    // Create a backup of the current file if it exists
    if (fs.existsSync(targetPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const backupPath = path.join(process.cwd(), "data", `ab.backup.${timestamp}.json`)

      try {
        const currentContent = await fsPromises.readFile(targetPath, "utf-8")
        await fsPromises.writeFile(backupPath, currentContent, "utf-8")
      } catch (backupError) {
        console.error("Failed to create backup:", backupError)
      }
    }

    // Copy file
    await fsPromises.writeFile(targetPath, content, "utf-8")

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
