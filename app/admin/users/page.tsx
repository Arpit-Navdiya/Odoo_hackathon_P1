"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Download, Eye, Ban, UserCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type UserData = {
  id: string
  name: string
  email: string
  photo: string
  signupDate: string
  status: "active" | "banned"
  skillsCount: number
  swapsCount: number
}

const mockUsers: UserData[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    photo: "/placeholder.svg?height=100&width=100",
    signupDate: "2024-01-01",
    status: "active",
    skillsCount: 5,
    swapsCount: 12,
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    photo: "/placeholder.svg?height=100&width=100",
    signupDate: "2024-01-05",
    status: "active",
    skillsCount: 3,
    swapsCount: 8,
  },
  {
    id: "3",
    name: "Carol Davis",
    email: "carol@example.com",
    photo: "/placeholder.svg?height=100&width=100",
    signupDate: "2024-01-10",
    status: "banned",
    skillsCount: 2,
    swapsCount: 1,
  },
  {
    id: "4",
    name: "David Wilson",
    email: "david@example.com",
    photo: "/placeholder.svg?height=100&width=100",
    signupDate: "2024-01-12",
    status: "active",
    skillsCount: 7,
    swapsCount: 15,
  },
  {
    id: "5",
    name: "Eva Martinez",
    email: "eva@example.com",
    photo: "/placeholder.svg?height=100&width=100",
    signupDate: "2024-01-15",
    status: "active",
    skillsCount: 4,
    swapsCount: 6,
  },
]

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserData[]>(mockUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleBanUser = (userId: string) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, status: "banned" as const } : user)))
    toast({
      title: "User Banned",
      description: "The user has been banned from the platform.",
      variant: "destructive",
    })
  }

  const handleUnbanUser = (userId: string) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, status: "active" as const } : user)))
    toast({
      title: "User Unbanned",
      description: "The user has been unbanned and can access the platform.",
    })
  }

  const exportUserList = () => {
    const headers = ["ID", "Name", "Email", "Signup Date", "Status", "Skills Count", "Swaps Count"]
    const csvContent = [
      headers.join(","),
      ...filteredUsers.map((user) =>
        [user.id, user.name, user.email, user.signupDate, user.status, user.skillsCount, user.swapsCount].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "users-list.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: UserData["status"]) => {
    return status === "active" ? (
      <Badge variant="default" className="bg-green-500">
        Active
      </Badge>
    ) : (
      <Badge variant="destructive">Banned</Badge>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
        <p className="text-muted-foreground">View and manage all platform users</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>User Management</CardTitle>
            <Button onClick={exportUserList} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Users
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Signup Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Swaps</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photo || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{new Date(user.signupDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{user.skillsCount}</TableCell>
                    <TableCell>{user.swapsCount}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          {user.status === "active" ? (
                            <DropdownMenuItem onClick={() => handleBanUser(user.id)} className="text-red-600">
                              <Ban className="mr-2 h-4 w-4" />
                              Ban User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUnbanUser(user.id)} className="text-green-600">
                              <UserCheck className="mr-2 h-4 w-4" />
                              Unban User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No users found matching your search criteria.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
