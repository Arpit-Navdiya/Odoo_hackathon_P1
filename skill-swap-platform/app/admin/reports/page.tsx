"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, BarChart3, Users, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type ReportType = {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  formats: string[]
}

const reportTypes: ReportType[] = [
  {
    id: "user-activity",
    title: "User Activity Logs",
    description: "Detailed logs of user actions, logins, and platform usage",
    icon: Users,
    formats: ["CSV", "PDF"],
  },
  {
    id: "swap-feedback",
    title: "Swap Feedback Logs",
    description: "User feedback and ratings for completed skill swaps",
    icon: MessageSquare,
    formats: ["CSV", "PDF"],
  },
  {
    id: "swap-statistics",
    title: "Skill Swap Statistics",
    description: "Analytics on swap success rates, popular skills, and trends",
    icon: BarChart3,
    formats: ["CSV", "PDF", "Excel"],
  },
  {
    id: "user-engagement",
    title: "User Engagement Report",
    description: "User retention, active users, and engagement metrics",
    icon: Users,
    formats: ["PDF", "Excel"],
  },
  {
    id: "skill-popularity",
    title: "Skill Popularity Report",
    description: "Most requested and offered skills with demand analysis",
    icon: BarChart3,
    formats: ["CSV", "PDF", "Excel"],
  },
  {
    id: "platform-health",
    title: "Platform Health Report",
    description: "Overall platform performance and health metrics",
    icon: FileText,
    formats: ["PDF"],
  },
]

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [format, setFormat] = useState("")
  const { toast } = useToast()

  const handleGenerateReport = () => {
    if (!selectedReport) {
      toast({
        title: "Error",
        description: "Please select a report type.",
        variant: "destructive",
      })
      return
    }

    if (!format) {
      toast({
        title: "Error",
        description: "Please select a format.",
        variant: "destructive",
      })
      return
    }

    // Simulate report generation
    const reportType = reportTypes.find((r) => r.id === selectedReport)
    toast({
      title: "Report Generated!",
      description: `${reportType?.title} has been generated and will be downloaded shortly.`,
    })

    // In a real app, this would trigger the actual report generation and download
    setTimeout(() => {
      toast({
        title: "Download Ready",
        description: "Your report is ready for download.",
      })
    }, 2000)
  }

  const selectedReportType = reportTypes.find((r) => r.id === selectedReport)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Download Reports</h1>
        <p className="text-muted-foreground">Generate and download various platform reports and analytics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Generator */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        {report.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedReportType && (
                  <p className="text-sm text-muted-foreground">{selectedReportType.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date-from">From Date</Label>
                  <Input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-to">To Date</Label>
                  <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select export format" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedReportType?.formats.map((fmt) => (
                      <SelectItem key={fmt} value={fmt.toLowerCase()}>
                        {fmt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateReport}
                className="w-full flex items-center gap-2"
                disabled={!selectedReport || !format}
              >
                <Download className="h-4 w-4" />
                Generate & Download Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Available Reports */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportTypes.map((report) => {
                  const Icon = report.icon
                  return (
                    <div
                      key={report.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedReport === report.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedReport(report.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5 text-primary" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{report.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                          <div className="flex gap-1 mt-2">
                            {report.formats.map((fmt) => (
                              <span key={fmt} className="text-xs px-2 py-1 bg-muted rounded">
                                {fmt}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">23</p>
              </div>
              <Download className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Most Popular</p>
                <p className="text-sm font-bold">User Activity</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Generated</p>
                <p className="text-sm font-bold">2 hours ago</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
