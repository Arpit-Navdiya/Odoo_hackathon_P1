"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search } from "lucide-react"

type SwapData = {
  id: string
  from: string
  to: string
  skillOffered: string
  skillWanted: string
  date: string
  status: "pending" | "accepted" | "rejected" | "completed"
}

const mockSwaps: SwapData[] = [
  {
    id: "1",
    from: "Alice Johnson",
    to: "Bob Smith",
    skillOffered: "Python",
    skillWanted: "JavaScript",
    date: "2024-01-15",
    status: "pending",
  },
  {
    id: "2",
    from: "Carol Davis",
    to: "David Wilson",
    skillOffered: "UI/UX Design",
    skillWanted: "DevOps",
    date: "2024-01-14",
    status: "accepted",
  },
  {
    id: "3",
    from: "Eva Martinez",
    to: "Frank Chen",
    skillOffered: "Digital Marketing",
    skillWanted: "Mobile Development",
    date: "2024-01-13",
    status: "completed",
  },
  {
    id: "4",
    from: "John Doe",
    to: "Jane Smith",
    skillOffered: "React",
    skillWanted: "Machine Learning",
    date: "2024-01-12",
    status: "rejected",
  },
  {
    id: "5",
    from: "Mike Johnson",
    to: "Sarah Wilson",
    skillOffered: "Node.js",
    skillWanted: "Data Science",
    date: "2024-01-11",
    status: "completed",
  },
]

export default function MonitorSwapsPage() {
  const [swaps, setSwaps] = useState<SwapData[]>(mockSwaps)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // Updated default value to 'all'
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filteredSwaps = swaps.filter((swap) => {
    const matchesSearch =
      searchTerm === "" ||
      swap.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      swap.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      swap.skillOffered.toLowerCase().includes(searchTerm.toLowerCase()) ||
      swap.skillWanted.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || swap.status === statusFilter

    const matchesDateRange = (!dateFrom || swap.date >= dateFrom) && (!dateTo || swap.date <= dateTo)

    return matchesSearch && matchesStatus && matchesDateRange
  })

  const getStatusBadge = (status: SwapData["status"]) => {
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
    }
  }

  const exportToCSV = () => {
    const headers = ["ID", "From", "To", "Skill Offered", "Skill Wanted", "Date", "Status"]
    const csvContent = [
      headers.join(","),
      ...filteredSwaps.map((swap) =>
        [swap.id, swap.from, swap.to, swap.skillOffered, swap.skillWanted, swap.date, swap.status].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "swap-requests.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Monitor Swaps</h1>
        <p className="text-muted-foreground">Track and manage all skill swap requests</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Swap Requests</CardTitle>
            <Button onClick={exportToCSV} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
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
                <SelectItem value="all">All Status</SelectItem> {/* Updated value prop to 'all' */}
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Input type="date" placeholder="From date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />

            <Input type="date" placeholder="To date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Skills Exchange</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSwaps.map((swap) => (
                  <TableRow key={swap.id}>
                    <TableCell className="font-medium">{swap.from}</TableCell>
                    <TableCell>{swap.to}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {swap.skillOffered}
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="outline" className="text-xs">
                          {swap.skillWanted}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(swap.date).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(swap.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredSwaps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No swap requests found matching your criteria.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
