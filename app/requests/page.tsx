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
import { ArrowRight, Check, X, Trash2 } from "lucide-react"

type SwapRequest = {
  id: string
  fromUser: {
    id: string
    name: string
    photo: string
  }
  toUser: {
    id: string
    name: string
    photo: string
  }
  skillOffered: string
  skillWanted: string
  message: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
}

// Mock data for swap requests
const mockRequests: SwapRequest[] = [
  {
    id: "1",
    fromUser: {
      id: "3",
      name: "Alice Johnson",
      photo: "/placeholder.svg?height=100&width=100",
    },
    toUser: {
      id: "2",
      name: "John Doe",
      photo: "/placeholder.svg?height=100&width=100",
    },
    skillOffered: "Python",
    skillWanted: "JavaScript",
    message: "Hi! I'd love to learn JavaScript from you. I have 5 years of Python experience.",
    status: "pending",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    fromUser: {
      id: "2",
      name: "John Doe",
      photo: "/placeholder.svg?height=100&width=100",
    },
    toUser: {
      id: "4",
      name: "Bob Smith",
      photo: "/placeholder.svg?height=100&width=100",
    },
    skillOffered: "React",
    skillWanted: "DevOps",
    message: "I'm interested in learning DevOps practices. Can teach React in return.",
    status: "accepted",
    createdAt: "2024-01-10",
  },
  {
    id: "3",
    fromUser: {
      id: "5",
      name: "Carol Davis",
      photo: "/placeholder.svg?height=100&width=100",
    },
    toUser: {
      id: "2",
      name: "John Doe",
      photo: "/placeholder.svg?height=100&width=100",
    },
    skillOffered: "UI/UX Design",
    skillWanted: "Node.js",
    message: "Would love to learn backend development!",
    status: "rejected",
    createdAt: "2024-01-08",
  },
]

export default function RequestsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [requests, setRequests] = useState<SwapRequest[]>([])

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    // Filter requests for current user
    const userRequests = mockRequests.filter((req) => req.fromUser.id === user.id || req.toUser.id === user.id)
    setRequests(userRequests)
  }, [user, router])

  const handleAccept = (requestId: string) => {
    setRequests((prev) => prev.map((req) => (req.id === requestId ? { ...req, status: "accepted" as const } : req)))
    toast({
      title: "Request Accepted",
      description: "The skill swap request has been accepted.",
    })
  }

  const handleReject = (requestId: string) => {
    setRequests((prev) => prev.map((req) => (req.id === requestId ? { ...req, status: "rejected" as const } : req)))
    toast({
      title: "Request Rejected",
      description: "The skill swap request has been rejected.",
    })
  }

  const handleDelete = (requestId: string) => {
    setRequests((prev) => prev.filter((req) => req.id !== requestId))
    toast({
      title: "Request Deleted",
      description: "The skill swap request has been deleted.",
    })
  }

  const getStatusBadge = (status: SwapRequest["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "accepted":
        return (
          <Badge variant="default" className="bg-green-500">
            Accepted
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
    }
  }

  const renderRequest = (request: SwapRequest) => {
    const isIncoming = request.toUser.id === user?.id
    const otherUser = isIncoming ? request.fromUser : request.toUser

    return (
      <Card key={request.id} className="mb-4">
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
                {isIncoming ? request.skillWanted : request.skillOffered}
              </Badge>
              <p className="text-xs text-muted-foreground">{isIncoming ? "They want to learn" : "You offer"}</p>
            </div>

            <ArrowRight className="mx-4 h-4 w-4 text-muted-foreground" />

            <div className="text-center">
              <Badge variant="outline" className="mb-1">
                {isIncoming ? request.skillOffered : request.skillWanted}
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
            <p className="text-xs text-muted-foreground">Sent on {new Date(request.createdAt).toLocaleDateString()}</p>

            {request.status === "pending" && (
              <div className="flex space-x-2">
                {isIncoming ? (
                  <>
                    <Button size="sm" onClick={() => handleAccept(request.id)}>
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(request.id)}>
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handleDelete(request.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
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

  const pendingRequests = requests.filter((req) => req.status === "pending")
  const acceptedRequests = requests.filter((req) => req.status === "accepted")
  const rejectedRequests = requests.filter((req) => req.status === "rejected")

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Swap Requests</h1>
          <p className="text-muted-foreground">Manage your skill exchange requests</p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
            <TabsTrigger value="accepted">Accepted ({acceptedRequests.length})</TabsTrigger>
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
      </main>
    </div>
  )
}
