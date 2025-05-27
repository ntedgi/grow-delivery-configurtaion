"use client"

import type { Filter } from "@/types/experiment"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"

interface FilterListProps {
  filters: Filter[] | undefined
}

export function FilterList({ filters }: FilterListProps) {
  if (!filters || filters.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">No filters found.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {filters.map((filter, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle className="text-lg">Application Filter</CardTitle>
            </div>
            <CardDescription>
              {filter.applicationIDs.length} application{filter.applicationIDs.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Application IDs</h4>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {filter.applicationIDs.slice(0, 20).map((appId, aIndex) => (
                    <Badge key={aIndex} variant="secondary" className="text-xs">
                      {appId}
                    </Badge>
                  ))}
                  {filter.applicationIDs.length > 20 && (
                    <Badge variant="outline" className="text-xs">
                      +{filter.applicationIDs.length - 20} more
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Landings</h4>
                <div className="space-y-2">
                  {filter.landings.map((landing, lIndex) => (
                    <div key={lIndex} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{landing.landingName}</p>
                          <p className="text-xs text-muted-foreground">ID: {landing.landingID}</p>
                        </div>
                        <Badge variant={landing.enabled ? "default" : "secondary"} className="text-xs">
                          {landing.enabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {Object.keys(landing.toggles).length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium mb-1">Toggles:</p>
                          <div className="text-xs font-mono bg-muted p-2 rounded">
                            <pre>{JSON.stringify(landing.toggles, null, 2)}</pre>
                          </div>
                        </div>
                      )}

                      {Object.keys(landing.sdkToggles).length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium mb-1">SDK Toggles:</p>
                          <div className="text-xs font-mono bg-muted p-2 rounded">
                            <pre>{JSON.stringify(landing.sdkToggles, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
