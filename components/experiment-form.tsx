"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import type { Experiment } from "@/types/experiment"

interface ExperimentFormProps {
  onSubmit: (experiment: Partial<Experiment>) => void
  initialData?: Experiment
  isEditing?: boolean
}

export function ExperimentForm({ onSubmit, initialData, isEditing = false }: ExperimentFormProps) {
  const [experiment, setExperiment] = useState<Partial<Experiment>>({
    landingID: 0,
    landingName: "",
    enabled: false,
    userClusters: [],
    toggles: {},
    sdkToggles: {},
  })

  const [clusterInput, setClusterInput] = useState("")
  const [toggleKey, setToggleKey] = useState("")
  const [toggleValue, setToggleValue] = useState("")
  const [sdkToggleKey, setSdkToggleKey] = useState("")
  const [sdkToggleValue, setSdkToggleValue] = useState("")

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setExperiment({
        ...initialData,
        // Ensure arrays and objects are cloned to avoid reference issues
        userClusters: [...(initialData.userClusters || [])],
        toggles: { ...(initialData.toggles || {}) },
        sdkToggles: { ...(initialData.sdkToggles || {}) },
      })
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(experiment)
  }

  const addCluster = () => {
    const cluster = Number.parseInt(clusterInput)
    if (!isNaN(cluster) && experiment.userClusters && !experiment.userClusters.includes(cluster)) {
      setExperiment({
        ...experiment,
        userClusters: [...experiment.userClusters, cluster],
      })
      setClusterInput("")
    }
  }

  const removeCluster = (cluster: number) => {
    setExperiment({
      ...experiment,
      userClusters: experiment.userClusters?.filter((c) => c !== cluster),
    })
  }

  const addToggle = () => {
    if (toggleKey && toggleValue) {
      try {
        const value = JSON.parse(toggleValue)
        setExperiment({
          ...experiment,
          toggles: {
            ...experiment.toggles,
            [toggleKey]: value,
          },
        })
        setToggleKey("")
        setToggleValue("")
      } catch (e) {
        // If not valid JSON, add as string
        setExperiment({
          ...experiment,
          toggles: {
            ...experiment.toggles,
            [toggleKey]: toggleValue,
          },
        })
        setToggleKey("")
        setToggleValue("")
      }
    }
  }

  const removeToggle = (key: string) => {
    const newToggles = { ...experiment.toggles }
    delete newToggles[key]
    setExperiment({
      ...experiment,
      toggles: newToggles,
    })
  }

  const addSdkToggle = () => {
    if (sdkToggleKey && sdkToggleValue) {
      try {
        const value = JSON.parse(sdkToggleValue)
        setExperiment({
          ...experiment,
          sdkToggles: {
            ...experiment.sdkToggles,
            [sdkToggleKey]: value,
          },
        })
        setSdkToggleKey("")
        setSdkToggleValue("")
      } catch (e) {
        // If not valid JSON, add as string
        setExperiment({
          ...experiment,
          sdkToggles: {
            ...experiment.sdkToggles,
            [sdkToggleKey]: sdkToggleValue,
          },
        })
        setSdkToggleKey("")
        setSdkToggleValue("")
      }
    }
  }

  const removeSdkToggle = (key: string) => {
    const newSdkToggles = { ...experiment.sdkToggles }
    delete newSdkToggles[key]
    setExperiment({
      ...experiment,
      sdkToggles: newSdkToggles,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Experiment" : "Create New Experiment"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="landingID">Landing ID</Label>
            <Input
              id="landingID"
              type="number"
              value={experiment.landingID}
              onChange={(e) => setExperiment({ ...experiment, landingID: Number.parseInt(e.target.value) || 0 })}
              required
              disabled={isEditing} // Disable editing of landing ID for existing experiments
            />
          </div>

          <div>
            <Label htmlFor="landingName">Landing Name</Label>
            <Input
              id="landingName"
              value={experiment.landingName}
              onChange={(e) => setExperiment({ ...experiment, landingName: e.target.value })}
              placeholder="e.g., Test-Disable auto-skovelray"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={experiment.enabled}
              onCheckedChange={(checked) => setExperiment({ ...experiment, enabled: checked })}
            />
            <Label htmlFor="enabled">Enable experiment</Label>
          </div>

          <div>
            <Label>User Clusters</Label>
            <div className="flex gap-2 mb-2">
              <Input
                type="number"
                placeholder="Cluster number"
                value={clusterInput}
                onChange={(e) => setClusterInput(e.target.value)}
              />
              <Button type="button" size="sm" onClick={addCluster}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {experiment.userClusters?.map((cluster) => (
                <Badge
                  key={cluster}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeCluster(cluster)}
                >
                  {cluster}
                  <Trash2 className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Toggles</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Key" value={toggleKey} onChange={(e) => setToggleKey(e.target.value)} />
                <Input
                  placeholder="Value (JSON or string)"
                  value={toggleValue}
                  onChange={(e) => setToggleValue(e.target.value)}
                />
                <Button type="button" size="sm" onClick={addToggle}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {Object.keys(experiment.toggles || {}).length > 0 && (
                <div>
                  <div className="text-xs font-mono bg-muted p-2 rounded">
                    <pre>{JSON.stringify(experiment.toggles, null, 2)}</pre>
                  </div>
                  <div className="mt-2">
                    <Label>Remove Toggles</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.keys(experiment.toggles || {}).map((key) => (
                        <Badge
                          key={key}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeToggle(key)}
                        >
                          {key}
                          <Trash2 className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>SDK Toggles</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Key" value={sdkToggleKey} onChange={(e) => setSdkToggleKey(e.target.value)} />
                <Input
                  placeholder="Value (JSON or string)"
                  value={sdkToggleValue}
                  onChange={(e) => setSdkToggleValue(e.target.value)}
                />
                <Button type="button" size="sm" onClick={addSdkToggle}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {Object.keys(experiment.sdkToggles || {}).length > 0 && (
                <div>
                  <div className="text-xs font-mono bg-muted p-2 rounded">
                    <pre>{JSON.stringify(experiment.sdkToggles, null, 2)}</pre>
                  </div>
                  <div className="mt-2">
                    <Label>Remove SDK Toggles</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.keys(experiment.sdkToggles || {}).map((key) => (
                        <Badge
                          key={key}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeSdkToggle(key)}
                        >
                          {key}
                          <Trash2 className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full">
            {isEditing ? "Update Experiment" : "Create Experiment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
