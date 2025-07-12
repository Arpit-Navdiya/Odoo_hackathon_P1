"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Download, Eye, Ban, UserCheck, Loader2, RefreshCw, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  photo?: string | null
  location?: string
  status: 'active' | 'banned' | 'suspended'
  emailVerified: boolean
  skillsOffered: Array<{
    skill: {
      _id: string
      name: string
      category: string
    }
    level: string
  }>
  skillsWanted: Array<{
    skill: {
      _id: string
      name: string
      category: string
    }
    level: string
  }>
  rating: {
    average: number
    count: number
  }
  lastActive: string
  createdAt: string
  updatedAt: string
}

interface UsersResponse {
  success: boolean
  count: number
  total: number
  pagination: {
    page: number
    limit: number
    pages: number
  }
  users: User[]
}

export default function ManageUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  // Fetch users from API
  const fetchUsers = async (page: number = 1) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params: any = {
        page,
        limit: 20,
      }

      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      const response: UsersResponse = await apiService.getAdminUsers(params)
      
      if (response.success) {
        setUsers(response.users)
        setTotalPages(response.pagination.pages)
        setTotalUsers(response.total)
        setCurrentPage(response.pagination.page)
      } else {
        setError('Failed to fetch users')
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }

  // Load users on component mount and when filters change
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setError('You do not have admin privileges to access this page.')
      setIsLoading(false)
      return
    }

    fetchUsers(1)
  }, [user, statusFilter])

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        setCurrentPage(1)
        fetchUsers(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchUsers(page)
  }

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'banned' | 'suspended') => {
    try {
      setProcessingUsers(prev => new Set(prev).add(userId))
      
      const response = await apiService.updateUserStatus(userId, newStatus)
      
      if (response.success) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user._id === userId 
            ? { ...user, status: newStatus }
            : user
        ))

        toast({
          title: `User ${newStatus === 'active' ? 'Unbanned' : newStatus === 'banned' ? 'Banned' : 'Suspended'}`,
          description: `User has been ${newStatus} successfully.`,
          variant: newStatus === 'active' ? 'default' : 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update user status",
        variant: "destructive",
      })
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const exportUserList = () => {
    const headers = ["ID", "Name", "Email", "Role", "Status", "Location", "Skills Offered", "Skills Wanted", "Rating", "Signup Date", "Last Active"]
    const csvContent = [
      headers.join(","),
      ...users.map((user) =>
        [
          user._id,
          user.name,
          user.email,
          user.role,
          user.status,
          user.location || "",
          user.skillsOffered.length,
          user.skillsWanted.length,
          user.rating.average.toFixed(1),
          new Date(user.createdAt).toLocaleDateString(),
          new Date(user.lastActive).toLocaleDateString()
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `users-list-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const getStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>
      case "banned":
        return <Badge variant="destructive">Banned</Badge>
      case "suspended":
        return <Badge variant="outline" className="bg-yellow-500 text-white">Suspended</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

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
            <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
            <p className="text-muted-foreground">View and manage all platform users</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => fetchUsers(currentPage)} 
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
              onClick={() => fetchUsers(currentPage)}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>User Management</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {users.length} of {totalUsers} total users
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button onClick={exportUserList} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Users
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading users...</span>
            </div>
          )}

          {/* Table */}
          {!isLoading && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Signup Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isProcessing = processingUsers.has(user._id)
                    return (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.photo || "/placeholder.svg"} alt={user.name} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              {user.location && (
                                <div className="text-xs text-muted-foreground">{user.location}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Offered: {user.skillsOffered.length}</div>
                            <div>Wanted: {user.skillsWanted.length}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{user.rating.average.toFixed(1)} ⭐</div>
                            <div className="text-muted-foreground">({user.rating.count} reviews)</div>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
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
                                  <>
                                    <DropdownMenuItem 
                                      onClick={() => handleStatusChange(user._id, 'suspended')}
                                      className="text-yellow-600"
                                    >
                                      <Ban className="mr-2 h-4 w-4" />
                                      Suspend User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleStatusChange(user._id, 'banned')}
                                      className="text-red-600"
                                    >
                                      <Ban className="mr-2 h-4 w-4" />
                                      Ban User
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(user._id, 'active')}
                                    className="text-green-600"
                                  >
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activate User
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your criteria.
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
