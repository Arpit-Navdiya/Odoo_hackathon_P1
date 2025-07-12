"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, Loader2, RefreshCw, AlertTriangle } from "lucide-react"
import { apiService } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SwapRequest {
  _id: string
  fromUser: {
    _id: string
    name: string
    email: string
  }
  toUser: {
    _id: string
    name: string
    email: string
  }
  skillOffered: {
    _id: string
    name: string
    category: string
  }
  skillWanted: {
    _id: string
    name: string
    category: string
  }
  message: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

interface SwapsResponse {
  success: boolean
  count: number
  total: number
  pagination: {
    page: number
    limit: number
    pages: number
  }
  swaps: SwapRequest[]
}

export default function MonitorSwapsPage() {
  const { user } = useAuth()
  const [swaps, setSwaps] = useState<SwapRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalSwaps, setTotalSwaps] = useState(0)

  // Fetch swaps from API
  const fetchSwaps = async (page: number = 1) => {
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

      if (dateFrom) {
        params.dateFrom = dateFrom
      }

      if (dateTo) {
        params.dateTo = dateTo
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      const response: SwapsResponse = await apiService.getAdminSwaps(params)
      
      if (response.success) {
        setSwaps(response.swaps)
        setTotalPages(response.pagination.pages)
        setTotalSwaps(response.total)
        setCurrentPage(response.pagination.page)
      } else {
        setError('Failed to fetch swap requests')
      }
    } catch (err) {
      console.error('Error fetching swaps:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch swap requests')
    } finally {
      setIsLoading(false)
    }
  }

  // Load swaps on component mount and when filters change
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setError('You do not have admin privileges to access this page.')
      setIsLoading(false)
      return
    }

    fetchSwaps(1)
  }, [user, statusFilter, dateFrom, dateTo, searchTerm])

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        setCurrentPage(1)
        fetchSwaps(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchSwaps(page)
  }

  const getStatusBadge = (status: SwapRequest["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "accepted":
        return (
          <Badge variant="default" className="bg-blue-500">
            Accepted
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            Completed
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const exportToCSV = () => {
    const headers = ["ID", "From", "To", "Skill Offered", "Skill Wanted", "Date", "Status", "Message"]
    const csvContent = [
      headers.join(","),
      ...swaps.map((swap) =>
        [
          swap._id,
          swap.fromUser.name,
          swap.toUser.name,
          swap.skillOffered.name,
          swap.skillWanted.name,
          new Date(swap.createdAt).toLocaleDateString(),
          swap.status,
          swap.message || ""
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `swap-requests-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setDateFrom("")
    setDateTo("")
    setCurrentPage(1)
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
            <h1 className="text-3xl font-bold mb-2">Monitor Swaps</h1>
            <p className="text-muted-foreground">Track and manage all skill swap requests</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => fetchSwaps(currentPage)} 
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
              onClick={() => fetchSwaps(currentPage)}
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
              <CardTitle>Swap Requests</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {swaps.length} of {totalSwaps} total requests
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button onClick={exportToCSV} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search swaps..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Input 
              type="date" 
              placeholder="From date" 
              value={dateFrom} 
              onChange={(e) => setDateFrom(e.target.value)} 
            />

            <Input 
              type="date" 
              placeholder="To date" 
              value={dateTo} 
              onChange={(e) => setDateTo(e.target.value)} 
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading swap requests...</span>
            </div>
          )}

          {/* Table */}
          {!isLoading && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Skills Exchange</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {swaps.map((swap) => (
                    <TableRow key={swap._id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{swap.fromUser.name}</div>
                          <div className="text-xs text-muted-foreground">{swap.fromUser.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{swap.toUser.name}</div>
                          <div className="text-xs text-muted-foreground">{swap.toUser.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {swap.skillOffered.name}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline" className="text-xs">
                            {swap.skillWanted.name}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(swap.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(swap.status)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={swap.message}>
                          {swap.message || "No message"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && swaps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No swap requests found matching your criteria.
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
