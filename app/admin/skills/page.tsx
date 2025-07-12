"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Flag, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type SkillSubmission = {
  id: string
  skill: string
  user: {
    name: string
    photo: string
  }
  submittedAt: string
  status: "pending" | "approved" | "rejected"
  flagged: boolean
  flagReason?: string
}

const mockSkills: SkillSubmission[] = [
  {
    id: "1",
    skill: "Advanced React Patterns",
    user: {
      name: "John Doe",
      photo: "/placeholder.svg?height=100&width=100",
    },
    submittedAt: "2024-01-15T10:30:00Z",
    status: "pending",
    flagged: false,
  },
  {
    id: "2",
    skill: "Machine Learning with TensorFlow",
    user: {
      name: "Alice Johnson",
      photo: "/placeholder.svg?height=100&width=100",
    },
    submittedAt: "2024-01-14T15:45:00Z",
    status: "approved",
    flagged: false,
  },
  {
    id: "3",
    skill: "Inappropriate Content Example",
    user: {
      name: "Bob Smith",
      photo: "/placeholder.svg?height=100&width=100",
    },
    submittedAt: "2024-01-13T09:15:00Z",
    status: "pending",
    flagged: true,
    flagReason: "Potentially inappropriate content",
  },
  {
    id: "4",
    skill: "DevOps with Kubernetes",
    user: {
      name: "Carol Davis",
      photo: "/placeholder.svg?height=100&width=100",
    },
    submittedAt: "2024-01-12T14:20:00Z",
    status: "rejected",
    flagged: false,
  },
  {
    id: "5",
    skill: "Blockchain Development",
    user: {
      name: "David Wilson",
      photo: "/placeholder.svg?height=100&width=100",
    },
    submittedAt: "2024-01-11T11:00:00Z",
    status: "pending",
    flagged: false,
  },
]

export default function SkillModerationPage() {
  const [skills, setSkills] = useState<SkillSubmission[]>(mockSkills)
  const { toast } = useToast()

  const handleApprove = (skillId: string) => {
    setSkills((prev) => prev.map((skill) => (skill.id === skillId ? { ...skill, status: "approved" as const } : skill)))
    toast({
      title: "Skill Approved",
      description: "The skill has been approved and is now visible to users.",
    })
  }

  const handleReject = (skillId: string) => {
    setSkills((prev) => prev.map((skill) => (skill.id === skillId ? { ...skill, status: "rejected" as const } : skill)))
    toast({
      title: "Skill Rejected",
      description: "The skill has been rejected and will not be visible to users.",
      variant: "destructive",
    })
  }

  const getStatusBadge = (status: SkillSubmission["status"]) => {
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
    }
  }

  const pendingSkills = skills.filter((skill) => skill.status === "pending")
  const flaggedSkills = skills.filter((skill) => skill.flagged)
  const approvedSkills = skills.filter((skill) => skill.status === "approved")
  const rejectedSkills = skills.filter((skill) => skill.status === "rejected")

  const renderSkillTable = (skillList: SkillSubmission[], showActions = true) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Skill</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {skillList.map((skill) => (
            <TableRow key={skill.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{skill.skill}</span>
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
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={skill.user.photo || "/placeholder.svg"} alt={skill.user.name} />
                    <AvatarFallback>{skill.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{skill.user.name}</span>
                </div>
              </TableCell>
              <TableCell>{new Date(skill.submittedAt).toLocaleDateString()}</TableCell>
              <TableCell>{getStatusBadge(skill.status)}</TableCell>
              {showActions && skill.status === "pending" && (
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(skill.id)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(skill.id)}>
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              )}
              {showActions && skill.status !== "pending" && (
                <TableCell>
                  <span className="text-sm text-muted-foreground">No actions</span>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Skill Moderation</h1>
        <p className="text-muted-foreground">Review and moderate user-submitted skills</p>
      </div>

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
          <Tabs defaultValue="pending" className="w-full">
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
        </CardContent>
      </Card>
    </div>
  )
}
