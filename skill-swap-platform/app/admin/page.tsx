"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageSquare, CheckCircle, AlertTriangle, Loader2, Shield } from "lucide-react"
import { apiService } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"

interface DashboardStats {
  users: {
    total: number
    active: number
    banned: number
  }
  swaps: {
    total: number
    pending: number
    completed: number
  }
  skills: {
    total: number
    pending: number
    flagged: number
  }
}

interface RecentActivity {
  swaps: Array<{
    _id: string
    fromUser: {
      _id: string
      name: string
    }
    toUser: {
      _id: string
      name: string
    }
    skillOffered: {
      _id: string
      name: string
    }
    skillWanted: {
      _id: string
      name: string
    }
    status: string
    createdAt: string
  }>
  users: Array<{
    _id: string
    name: string
    email: string
    createdAt: string
  }>
}

interface DashboardResponse {
  success: boolean
  stats: DashboardStats
  recentActivity: RecentActivity
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await apiService.getAdminDashboard()
        setDashboardData(response)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data'
        
        // Check if it's an authorization error
        if (errorMessage.includes('403') || errorMessage.includes('not authorized')) {
          setError('You do not have admin privileges to access this dashboard.')
        } else {
          setError(errorMessage)
        }
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch if user is admin
    if (user && user.role === 'admin') {
      fetchDashboardData()
    } else {
      setIsLoading(false)
      setError('You do not have admin privileges to access this dashboard.')
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className="text-orange-600 mb-2">{error}</p>
            {user && user.role !== 'admin' && (
              <p className="text-sm text-muted-foreground">
                Current role: {user.role} | Required role: admin
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No dashboard data available</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: "Total Users",
      value: dashboardData.stats.users.total.toString(),
      icon: Users,
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Active Swaps",
      value: dashboardData.stats.swaps.pending.toString(),
      icon: MessageSquare,
      change: "+5%",
      changeType: "positive" as const,
    },
    {
      title: "Completed Swaps",
      value: dashboardData.stats.swaps.completed.toString(),
      icon: CheckCircle,
      change: "+18%",
      changeType: "positive" as const,
    },
    {
      title: "Pending Reviews",
      value: dashboardData.stats.skills.pending.toString(),
      icon: AlertTriangle,
      change: "-8%",
      changeType: "negative" as const,
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your skill swap platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Swap Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentActivity.swaps.length > 0 ? (
                dashboardData.recentActivity.swaps.map((swap) => (
                  <div key={swap._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {swap.fromUser.name} → {swap.toUser.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {swap.skillOffered.name} → {swap.skillWanted.name}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(swap.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent swap requests</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentActivity.users.length > 0 ? (
                dashboardData.recentActivity.users.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent users</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
