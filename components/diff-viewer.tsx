"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DiffViewerProps {
  diff: string
}

export function DiffViewer({ diff }: DiffViewerProps) {
  const lines = diff.split("\n")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Changes Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <pre className="text-sm">
            {lines.map((line, index) => {
              let className = ""
              if (line.startsWith("+") && !line.startsWith("+++")) {
                className = "text-green-600 bg-green-50"
              } else if (line.startsWith("-") && !line.startsWith("---")) {
                className = "text-red-600 bg-red-50"
              } else if (line.startsWith("@@")) {
                className = "text-blue-600 bg-blue-50"
              }

              return (
                <div key={index} className={className}>
                  {line}
                </div>
              )
            })}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
