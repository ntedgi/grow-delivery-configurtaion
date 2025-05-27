"use client"

import type { Experiment } from "@/types/experiment"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Edit } from "lucide-react"

interface ExperimentListProps {
  experiments: Experiment[] | undefined
  onEdit: (experiment: Experiment) => void
}

export function ExperimentList({ experiments, onEdit }: ExperimentListProps) {
  if (!experiments || experiments.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">No experiments found. Create your first experiment to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {experiments.map((experiment, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{experiment.landingName}</CardTitle>
                <CardDescription className="mt-1">Landing ID: {experiment.landingID}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={experiment.enabled ? "default" : "secondary"}>
                  {experiment.enabled ? "Active" : "Inactive"}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => onEdit(experiment)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {experiment.userClusters && experiment.userClusters.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Users className="h-4 w-4" />
                    User Clusters
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {experiment.userClusters.map((cluster, cIndex) => (
                      <Badge key={cIndex} variant="outline" className="text-xs">
                        {cluster}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(experiment.toggles).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Toggles</h4>
                  <div className="text-xs font-mono bg-muted p-2 rounded">
                    <pre>{JSON.stringify(experiment.toggles, null, 2)}</pre>
                  </div>
                </div>
              )}

              {Object.keys(experiment.sdkToggles).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">SDK Toggles</h4>
                  <div className="text-xs font-mono bg-muted p-2 rounded">
                    <pre>{JSON.stringify(experiment.sdkToggles, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
