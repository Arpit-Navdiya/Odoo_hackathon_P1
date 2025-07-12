"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageSquare, CheckCircle, AlertTriangle } from "lucide-react"

export default function AdminDashboard() {
  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      icon: Users,
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Active Swaps",
      value: "89",
      icon: MessageSquare,
      change: "+5%",
      changeType: "positive" as const,
    },
    {
      title: "Completed Swaps",
      value: "456",
      icon: CheckCircle,
      change: "+18%",
      changeType: "positive" as const,
    },
    {
      title: "Pending Reviews",
      value: "23",
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
              {[
                { from: "Alice Johnson", to: "Bob Smith", skill: "Python → JavaScript" },
                { from: "Carol Davis", to: "David Wilson", skill: "Design → DevOps" },
                { from: "Eva Martinez", to: "Frank Chen", skill: "Marketing → Mobile Dev" },
              ].map((swap, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {swap.from} → {swap.to}
                    </p>
                    <p className="text-sm text-muted-foreground">{swap.skill}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">2 hours ago</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { user: "John Doe", skill: "Advanced React Patterns", status: "pending" },
                { user: "Jane Smith", skill: "Machine Learning with TensorFlow", status: "pending" },
                { user: "Mike Johnson", skill: "Blockchain Development", status: "flagged" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.user}</p>
                    <p className="text-sm text-muted-foreground">{item.skill}</p>
                  </div>
                  <div
                    className={`text-xs px-2 py-1 rounded ${
                      item.status === "flagged" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
