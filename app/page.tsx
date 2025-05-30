"use client"

import { useState, useEffect } from "react"
import { ExperimentList } from "@/components/experiment-list"
import { FilterList } from "@/components/filter-list"
import { ExperimentForm } from "@/components/experiment-form"
import { DiffViewer } from "@/components/diff-viewer"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RefreshCw, GitPullRequest, CheckCircle, Save, AlertTriangle, X } from "lucide-react"
import type { ExperimentsConfig, Experiment } from "@/types/experiment"

export default function Dashboard() {
  const [config, setConfig] = useState<ExperimentsConfig | null>(null)
  const [diff, setDiff] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [prUrl, setPrUrl] = useState("")
  const [isGitHubConfigured, setIsGitHubConfigured] = useState(false)
  const [activeTab, setActiveTab] = useState("experiments")
  const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [experimentToDelete, setExperimentToDelete] = useState<Experiment | null>(null)

  useEffect(() => {
    fetchExperiments()
  }, [])

  const fetchExperiments = async () => {
    setLoading(true)
    setError(null)
    setMessage("")

    try {
      console.log("Fetching experiments...")
      const response = await fetch("/api/experiments")

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response from /api/experiments:", errorData)

        // Check if it's a JSON error that was fixed
        if (errorData.message?.includes("reset to defaults")) {
          setMessage("The experiments file was corrupted and has been reset. Your data is safe in a backup file.")
          // Try fetching again after a short delay
          setTimeout(() => {
            fetchExperiments()
          }, 1000)
          return
        }

        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched data:", data)

      setConfig(data)
      setError(null)

      // Check if GitHub sync button should be shown
      checkGitHubConfig()
    } catch (error) {
      console.error("Failed to fetch experiments:", error)
      setError(error instanceof Error ? error.message : "Unknown error occurred")

      // Try to load default data if fetch fails
      try {
        console.log("Attempting to load default data...")
        const response = await fetch("/api/reset-to-default")
        if (response.ok) {
          console.log("Default data loaded successfully")
          setMessage("Loaded default configuration")
          await fetchExperiments()
        }
      } catch (defaultError) {
        console.error("Failed to load default data:", defaultError)
      }
    } finally {
      setLoading(false)
    }
  }

  const checkGitHubConfig = async () => {
    try {
      console.log("Checking GitHub configuration...")
      const syncResponse = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const syncData = await syncResponse.json()
      console.log("GitHub sync check response:", syncData)

      // Check if GitHub is configured based on the response
      const configured = syncData.success === true || !syncData.message?.includes("not configured")
      console.log("GitHub configured:", configured)
      setIsGitHubConfigured(configured)
    } catch (syncError) {
      console.error("Error checking GitHub config:", syncError)
      setIsGitHubConfigured(false)
    }
  }

  const resetToDefault = async () => {
    setLoading(true)
    setError(null)
    setMessage("")

    try {
      console.log("Resetting to default configuration...")
      const response = await fetch("/api/reset-to-default")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      await fetchExperiments()
      setMessage("Successfully reset to default configuration")
    } catch (error) {
      console.error("Failed to reset to default:", error)
      setError(error instanceof Error ? error.message : "Failed to reset to default")
    } finally {
      setLoading(false)
    }
  }

  const syncWithGitHub = async () => {
    if (!isGitHubConfigured) {
      setMessage("GitHub integration not configured. Using local storage only.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      console.log("Syncing with GitHub...")
      const response = await fetch("/api/github/sync", { method: "POST" })
      const data = await response.json()

      console.log("GitHub sync response:", data)

      if (!data.success) {
        throw new Error(data.details || data.error || "Failed to sync with GitHub")
      }

      await fetchExperiments()
      setMessage("Successfully synced with GitHub")
    } catch (error) {
      console.error("Failed to sync with GitHub:", error)
      setMessage(error instanceof Error ? error.message : "Failed to sync with GitHub")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExperiment = async (experiment: Partial<Experiment>) => {
    setLoading(true)
    setError(null)

    try {
      console.log("Creating experiment:", experiment)
      const response = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(experiment),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setConfig(result.config)
      setDiff(result.diff)
      setMessage("Experiment created successfully")
      setError(null)
      setActiveTab("experiments")
    } catch (error) {
      console.error("Failed to create experiment:", error)
      setError(error instanceof Error ? error.message : "Failed to create experiment")
    } finally {
      setLoading(false)
    }
  }

  const handleEditExperiment = (experiment: Experiment) => {
    console.log("Editing experiment:", experiment)
    setEditingExperiment(experiment)
    setShowEditDialog(true)
  }

  const handleUpdateExperiment = async (updatedExperiment: Partial<Experiment>) => {
    if (!editingExperiment) return

    setLoading(true)
    setError(null)

    try {
      console.log("Updating experiment:", updatedExperiment)
      const response = await fetch("/api/experiments/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedExperiment),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setConfig(result.config)
      setDiff(result.diff)
      setMessage("Experiment updated successfully")
      setError(null)
      setShowEditDialog(false)
      setEditingExperiment(null)
    } catch (error) {
      console.error("Failed to update experiment:", error)
      setError(error instanceof Error ? error.message : "Failed to update experiment")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExperiment = (experiment: Experiment) => {
    console.log("Preparing to delete experiment:", experiment)
    setExperimentToDelete(experiment)
    setShowDeleteDialog(true)
  }

  const confirmDeleteExperiment = async () => {
    if (!experimentToDelete) return

    setLoading(true)
    setError(null)
    setShowDeleteDialog(false)

    try {
      console.log("Deleting experiment:", experimentToDelete)
      const response = await fetch("/api/experiments/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experimentId: experimentToDelete.landingID }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setConfig(result.config)
      setDiff(result.diff)
      setMessage(`Experiment "${experimentToDelete.landingName}" deleted successfully`)
      setError(null)
      setExperimentToDelete(null)
    } catch (error) {
      console.error("Failed to delete experiment:", error)
      setError(error instanceof Error ? error.message : "Failed to delete experiment")
    } finally {
      setLoading(false)
    }
  }

  const cancelDeleteExperiment = () => {
    setExperimentToDelete(null)
    setShowDeleteDialog(false)
  }

  const createPullRequest = async () => {
    if (!config) return

    setLoading(true)
    setError(null)

    try {
      console.log("Creating pull request...")
      const response = await fetch("/api/github/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          message: "Update experiments configuration",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.prUrl) {
        setPrUrl(result.prUrl)
        setMessage("Pull request created successfully")
      } else {
        setMessage(result.message || "Changes saved locally")
      }
    } catch (error) {
      console.error("Failed to create pull request:", error)
      setError(error instanceof Error ? error.message : "Failed to create pull request")
    } finally {
      setLoading(false)
    }
  }

  const saveChanges = async () => {
    if (!config) return

    setLoading(true)
    setError(null)

    try {
      console.log("Saving changes locally...")
      const response = await fetch("/api/github/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          message: "Update experiments configuration",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      setMessage("Changes saved successfully")
      setError(null)
    } catch (error) {
      console.error("Failed to save changes:", error)
      setError(error instanceof Error ? error.message : "Failed to save changes")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">A/B Test Manager</h1>
        <div className="flex gap-2">
          <Button onClick={fetchExperiments} disabled={loading} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={resetToDefault} disabled={loading} variant="outline" size="sm">
            Reset to Default
          </Button>
          {isGitHubConfigured && (
            <Button onClick={syncWithGitHub} disabled={loading} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync with GitHub
            </Button>
          )}
          {diff && (
            <>
              <Button onClick={saveChanges} disabled={loading} variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save Locally
              </Button>
              {isGitHubConfigured && (
                <Button onClick={createPullRequest} disabled={loading}>
                  <GitPullRequest className="h-4 w-4 mr-2" />
                  Create PR
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert className="mb-4" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {error.includes("JSON") && (
              <div className="mt-2">
                <Button onClick={fetchExperiments} size="sm" variant="outline">
                  Try Again
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {prUrl && (
        <Alert className="mb-4">
          <GitPullRequest className="h-4 w-4" />
          <AlertDescription>
            Pull request created:{" "}
            <a href={prUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {prUrl}
            </a>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      ) : config ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="experiments">Experiments ({config.experiments?.length || 0})</TabsTrigger>
            <TabsTrigger value="filters">Filters ({config.filters?.length || 0})</TabsTrigger>
            <TabsTrigger value="default">Default Config</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
            {diff && <TabsTrigger value="diff">View Changes</TabsTrigger>}
          </TabsList>

          <TabsContent value="experiments">
            <ExperimentList
              experiments={config.experiments}
              onEdit={handleEditExperiment}
              onDelete={handleDeleteExperiment}
            />
          </TabsContent>

          <TabsContent value="filters">
            <FilterList filters={config.filters} />
          </TabsContent>

          <TabsContent value="default">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{config.default.landingName}</CardTitle>
                    <CardDescription>Landing ID: {config.default.landingID}</CardDescription>
                  </div>
                  <Badge variant={config.default.enabled ? "default" : "secondary"}>
                    {config.default.enabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Toggles</h4>
                    <div className="text-xs font-mono bg-muted p-4 rounded overflow-auto max-h-96">
                      <pre>{JSON.stringify(config.default.toggles, null, 2)}</pre>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">SDK Toggles</h4>
                    <div className="text-xs font-mono bg-muted p-4 rounded overflow-auto max-h-96">
                      <pre>{JSON.stringify(config.default.sdkToggles, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <ExperimentForm onSubmit={handleCreateExperiment} />
          </TabsContent>

          {diff && (
            <TabsContent value="diff">
              <DiffViewer diff={diff} />
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <div className="text-center p-8">
          <p className="text-muted-foreground">No configuration loaded</p>
          <Button onClick={resetToDefault} className="mt-4">
            Load Default Configuration
          </Button>
        </div>
      )}

      {/* Edit Experiment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Experiment</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowEditDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {editingExperiment && (
            <ExperimentForm onSubmit={handleUpdateExperiment} initialData={editingExperiment} isEditing={true} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={showDeleteDialog}
        onClose={cancelDeleteExperiment}
        onConfirm={confirmDeleteExperiment}
        title="Delete Experiment"
        description={
          experimentToDelete
            ? `Are you sure you want to delete the experiment "${experimentToDelete.landingName}"? This action cannot be undone.`
            : "Are you sure you want to delete this experiment? This action cannot be undone."
        }
      />
    </div>
  )
}
