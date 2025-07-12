"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Flag, AlertTriangle, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Skill {
  _id: string
  name: string
  category: string
  description?: string
  tags?: string[]
  status: 'pending' | 'approved' | 'rejected'
  flagged: boolean
  flagReason?: string
  popularity: {
    offeredCount: number
    wantedCount: number
  }
  submittedBy: {
    _id: string
    name: string
    email: string
  }
  moderatedBy?: {
    _id: string
    name: string
  }
  createdAt: string
  updatedAt: string
  moderatedAt?: string
}

interface SkillsResponse {
  success: boolean
  count: number
  total: number
  pagination: {
    page: number
    limit: number
    pages: number
  }
  skills: Skill[]
}

export default function SkillModerationPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [processingSkills, setProcessingSkills] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  // Fetch skills from API
  const fetchSkills = async (status: string = "pending") => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params: any = {
        page: 1,
        limit: 100, // Get all skills for now
        status: status === "all" ? "all" : status
      }

      // Handle flagged skills
      if (status === "flagged") {
        params.flagged = "true"
        params.status = "all"
      }

      const response: SkillsResponse = await apiService.getAdminSkills(params)
      
      if (response.success) {
        setSkills(response.skills)
      } else {
        setError('Failed to fetch skills')
      }
    } catch (err) {
      console.error('Error fetching skills:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch skills')
    } finally {
      setIsLoading(false)
    }
  }

  // Load skills on component mount and when tab changes
  useEffect(() => {
    // Don't fetch if still loading auth state
    if (authLoading) {
      return
    }

    // Don't fetch if user is not authenticated or not admin
    if (!user || user.role !== 'admin') {
      setError('You do not have admin privileges to access this page.')
      setIsLoading(false)
      return
    }

    fetchSkills(activeTab)
  }, [user, authLoading, activeTab])

  const handleApprove = async (skillId: string) => {
    try {
      setProcessingSkills(prev => new Set(prev).add(skillId))
      
      const response = await apiService.moderateSkill(skillId, 'approve')
      
      if (response.success) {
        // Update local state
        setSkills(prev => prev.map(skill => 
          skill._id === skillId 
            ? { ...skill, status: 'approved' as const }
            : skill
        ))

        toast({
          title: "Skill Approved",
          description: "The skill has been approved and is now visible to users.",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to approve skill",
        variant: "destructive",
      })
    } finally {
      setProcessingSkills(prev => {
        const newSet = new Set(prev)
        newSet.delete(skillId)
        return newSet
      })
    }
  }

  const handleReject = async (skillId: string) => {
    try {
      setProcessingSkills(prev => new Set(prev).add(skillId))
      
      const response = await apiService.moderateSkill(skillId, 'reject')
      
      if (response.success) {
        // Update local state
        setSkills(prev => prev.map(skill => 
          skill._id === skillId 
            ? { ...skill, status: 'rejected' as const }
            : skill
        ))

        toast({
          title: "Skill Rejected",
          description: "The skill has been rejected and will not be visible to users.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to reject skill",
        variant: "destructive",
      })
    } finally {
      setProcessingSkills(prev => {
        const newSet = new Set(prev)
        newSet.delete(skillId)
        return newSet
      })
    }
  }

  const getStatusBadge = (status: Skill["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500">
            Approved
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Filter skills based on active tab
  const pendingSkills = skills.filter((skill) => skill.status === "pending")
  const flaggedSkills = skills.filter((skill) => skill.flagged)
  const approvedSkills = skills.filter((skill) => skill.status === "approved")
  const rejectedSkills = skills.filter((skill) => skill.status === "rejected")

  const renderSkillTable = (skillList: Skill[], showActions = true) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Skill</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {skillList.map((skill) => {
            const isProcessing = processingSkills.has(skill._id)
            return (
              <TableRow key={skill._id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="font-medium">{skill.name}</span>
                      {skill.description && (
                        <p className="text-xs text-muted-foreground mt-1">{skill.description}</p>
                      )}
                    </div>
                    {skill.flagged && (
                      <div className="flex items-center gap-1">
                        <Flag className="h-4 w-4 text-red-500" />
                        <Badge variant="destructive" className="text-xs">
                          Flagged
                        </Badge>
                      </div>
                    )}
                  </div>
                  {skill.flagReason && <p className="text-xs text-red-600 mt-1">{skill.flagReason}</p>}
                  {skill.tags && skill.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {skill.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {skill.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{skill.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {skill.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder.svg" alt={skill.submittedBy.name} />
                      <AvatarFallback>{skill.submittedBy.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{skill.submittedBy.name}</div>
                      <div className="text-xs text-muted-foreground">{skill.submittedBy.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{new Date(skill.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{getStatusBadge(skill.status)}</TableCell>
                {showActions && skill.status === "pending" && (
                  <TableCell>
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(skill._id)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(skill._id)}>
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                )}
                {showActions && skill.status !== "pending" && (
                  <TableCell>
                    <span className="text-sm text-muted-foreground">No actions</span>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show access denied if user is not admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className="text-orange-600">You do not have admin privileges to access this page.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Skill Moderation</h1>
            <p className="text-muted-foreground">Review and moderate user-submitted skills</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => fetchSkills(activeTab)} 
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
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={() => fetchSkills(activeTab)}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{pendingSkills.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Flagged</p>
                <p className="text-2xl font-bold text-red-600">{flaggedSkills.length}</p>
              </div>
              <Flag className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedSkills.length}</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{rejectedSkills.length}</p>
              </div>
              <X className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skill Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading skills...</span>
            </div>
          )}

          {!isLoading && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending">Pending ({pendingSkills.length})</TabsTrigger>
                <TabsTrigger value="flagged">Flagged ({flaggedSkills.length})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({approvedSkills.length})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({rejectedSkills.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-6">
                {pendingSkills.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No pending skills to review</div>
                ) : (
                  renderSkillTable(pendingSkills)
                )}
              </TabsContent>

              <TabsContent value="flagged" className="mt-6">
                {flaggedSkills.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No flagged skills</div>
                ) : (
                  renderSkillTable(flaggedSkills)
                )}
              </TabsContent>

              <TabsContent value="approved" className="mt-6">
                {approvedSkills.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No approved skills</div>
                ) : (
                  renderSkillTable(approvedSkills, false)
                )}
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                {rejectedSkills.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No rejected skills</div>
                ) : (
                  renderSkillTable(rejectedSkills, false)
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
