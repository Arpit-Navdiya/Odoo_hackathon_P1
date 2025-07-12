"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { apiService, type SwapRequest } from "@/lib/api"
import { ArrowRight, Check, X, Trash2, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RequestsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  // State management
  const [requests, setRequests] = useState<SwapRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set())

  // Fetch swap requests from API
  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Fetching swap requests...')
      const response = await apiService.getSwapRequests({
        limit: 100 // Get all requests for now
      })
      
      console.log('Swap requests response:', response)
      
      // Ensure we have a valid response with swapRequests array
      if (response && response.swapRequests) {
        console.log('Setting requests:', response.swapRequests)
        setRequests(response.swapRequests)
      } else {
        console.log('No swapRequests in response, setting empty array')
        setRequests([])
      }
    } catch (err) {
      console.error('Error fetching swap requests:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch swap requests')
      setRequests([]) // Set empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  // Load requests on component mount
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    console.log('Current user:', user)
    fetchRequests()
  }, [user, router])

  // Handle accept request
  const handleAccept = async (requestId: string) => {
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId))
      
      const response = await apiService.updateSwapRequest(requestId, {
        action: 'accept'
      })

      if (response.success) {
        // Update local state
        setRequests(prev => prev.map(req => 
          req._id === requestId 
            ? { ...req, status: 'accepted' as const }
            : req
        ))

        toast({
          title: "Request Accepted",
          description: "The skill swap request has been accepted successfully.",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to accept request",
        variant: "destructive",
      })
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
  }

  // Handle reject request
  const handleReject = async (requestId: string) => {
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId))
      
      const response = await apiService.updateSwapRequest(requestId, {
        action: 'reject'
      })

      if (response.success) {
        // Update local state
        setRequests(prev => prev.map(req => 
          req._id === requestId 
            ? { ...req, status: 'rejected' as const }
            : req
        ))

        toast({
          title: "Request Rejected",
          description: "The skill swap request has been rejected.",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to reject request",
        variant: "destructive",
      })
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
  }

  // Handle complete request
  const handleComplete = async (requestId: string) => {
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId))
      
      const response = await apiService.updateSwapRequest(requestId, {
        action: 'complete'
      })

      if (response.success) {
        // Update local state
        setRequests(prev => prev.map(req => 
          req._id === requestId 
            ? { ...req, status: 'completed' as const }
            : req
        ))

        toast({
          title: "Request Completed",
          description: "The skill swap has been marked as completed.",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to complete request",
        variant: "destructive",
      })
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
  }

  // Handle delete request
  const handleDelete = async (requestId: string) => {
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId))
      
      const response = await apiService.deleteSwapRequest(requestId)

      if (response.success) {
        // Remove from local state
        setRequests(prev => prev.filter(req => req._id !== requestId))

        toast({
          title: "Request Deleted",
          description: "The skill swap request has been deleted.",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete request",
        variant: "destructive",
      })
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
  }

  // Get status badge with proper styling
  const getStatusBadge = (status: SwapRequest["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "accepted":
        return <Badge variant="default" className="bg-green-500">Accepted</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "completed":
        return <Badge variant="default" className="bg-blue-500">Completed</Badge>
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Render individual request card
  const renderRequest = (request: SwapRequest) => {
    if (!request || !request.fromUser || !request.toUser || !request.skillOffered || !request.skillWanted) {
      return null // Skip rendering invalid requests
    }
    
    const isIncoming = request.toUser._id === user?._id
    const otherUser = isIncoming ? request.fromUser : request.toUser
    const isProcessing = processingRequests.has(request._id)

    return (
      <Card key={request._id} className="mb-4">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={otherUser.photo || "/placeholder.svg"} alt={otherUser.name} />
                <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{otherUser.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {isIncoming ? "Wants to learn from you" : "You want to learn from them"}
                </p>
              </div>
            </div>
            {getStatusBadge(request.status)}
          </div>

          <div className="flex items-center justify-center mb-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <Badge variant="secondary" className="mb-1">
                {isIncoming ? request.skillWanted.name : request.skillOffered.name}
              </Badge>
              <p className="text-xs text-muted-foreground">{isIncoming ? "They want to learn" : "You offer"}</p>
            </div>

            <ArrowRight className="mx-4 h-4 w-4 text-muted-foreground" />

            <div className="text-center">
              <Badge variant="outline" className="mb-1">
                {isIncoming ? request.skillOffered.name : request.skillWanted.name}
              </Badge>
              <p className="text-xs text-muted-foreground">{isIncoming ? "They offer" : "You want to learn"}</p>
            </div>
          </div>

          {request.message && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm">{request.message}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Sent on {new Date(request.createdAt).toLocaleDateString()}
            </p>

            {/* Action buttons based on status and user role */}
            {!isProcessing && (
              <div className="flex space-x-2">
                {request.status === "pending" && (
                  <>
                    {isIncoming ? (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => handleAccept(request._id)}
                          disabled={isProcessing}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleReject(request._id)}
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(request._id)}
                        disabled={isProcessing}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </>
                )}

                {request.status === "accepted" && (
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleComplete(request._id)}
                    disabled={isProcessing}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark Complete
                  </Button>
                )}

                {(request.status === "rejected" || request.status === "completed" || request.status === "cancelled") && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDelete(request._id)}
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Processing...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return null
  }

  // Filter requests by status
  const pendingRequests = (requests || []).filter((req) => req.status === "pending")
  const acceptedRequests = (requests || []).filter((req) => req.status === "accepted")
  const completedRequests = (requests || []).filter((req) => req.status === "completed")
  const rejectedRequests = (requests || []).filter((req) => req.status === "rejected")

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Swap Requests</h1>
              <p className="text-muted-foreground">Manage your skill exchange requests</p>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchRequests} 
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4"
                onClick={fetchRequests}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading requests...</span>
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({acceptedRequests.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedRequests.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No pending requests</p>
                  </CardContent>
                </Card>
              ) : (
                pendingRequests.map(renderRequest)
              )}
            </TabsContent>

            <TabsContent value="accepted" className="mt-6">
              {acceptedRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No accepted requests</p>
                  </CardContent>
                </Card>
              ) : (
                acceptedRequests.map(renderRequest)
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              {completedRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No completed requests</p>
                  </CardContent>
                </Card>
              ) : (
                completedRequests.map(renderRequest)
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {rejectedRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No rejected requests</p>
                  </CardContent>
                </Card>
              ) : (
                rejectedRequests.map(renderRequest)
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
