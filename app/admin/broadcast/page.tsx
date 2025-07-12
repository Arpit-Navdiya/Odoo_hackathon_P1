"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Megaphone, Send, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type BroadcastMessage = {
  id: string
  title: string
  message: string
  sentAt: string
  recipientCount: number
  status: "sent" | "draft"
}

const mockMessages: BroadcastMessage[] = [
  {
    id: "1",
    title: "Welcome to Skill Swap Platform!",
    message: "We're excited to have you join our community of learners and teachers.",
    sentAt: "2024-01-15T10:00:00Z",
    recipientCount: 1234,
    status: "sent",
  },
  {
    id: "2",
    title: "New Features Available",
    message: "Check out our new skill matching algorithm and improved user profiles.",
    sentAt: "2024-01-10T14:30:00Z",
    recipientCount: 1156,
    status: "sent",
  },
  {
    id: "3",
    title: "Maintenance Notice",
    message: "Scheduled maintenance will occur this weekend from 2-4 AM EST.",
    sentAt: "2024-01-08T09:15:00Z",
    recipientCount: 1089,
    status: "sent",
  },
]

export default function BroadcastPage() {
  const [messages, setMessages] = useState<BroadcastMessage[]>(mockMessages)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const { toast } = useToast()

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and message fields.",
        variant: "destructive",
      })
      return
    }

    const newMessage: BroadcastMessage = {
      id: Date.now().toString(),
      title: title.trim(),
      message: message.trim(),
      sentAt: new Date().toISOString(),
      recipientCount: 1234, // Mock recipient count
      status: "sent",
    }

    setMessages((prev) => [newMessage, ...prev])
    setTitle("")
    setMessage("")
    setShowPreview(false)

    toast({
      title: "Message Sent!",
      description: `Broadcast message sent to ${newMessage.recipientCount} users.`,
    })
  }

  const getStatusBadge = (status: BroadcastMessage["status"]) => {
    return status === "sent" ? (
      <Badge variant="default" className="bg-green-500">
        Sent
      </Badge>
    ) : (
      <Badge variant="secondary">Draft</Badge>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Broadcast Messages</h1>
        <p className="text-muted-foreground">Send announcements and updates to all platform users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Compose Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Compose Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Message Title</Label>
              <Input
                id="title"
                placeholder="Enter message title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message Content</Label>
              <Textarea
                id="message"
                placeholder="Enter your message content..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? "Hide Preview" : "Preview"}
              </Button>
              <Button
                onClick={handleSend}
                className="flex items-center gap-2"
                disabled={!title.trim() || !message.trim()}
              >
                <Send className="h-4 w-4" />
                Send Message
              </Button>
            </div>

            {/* Preview Card */}
            {showPreview && title && message && (
              <Card className="mt-4 border-2 border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <Badge variant="outline">Preview</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{message}</p>
                  <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
                    This message will be sent to approximately 1,234 users
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Message History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messages.slice(0, 5).map((msg) => (
                <div key={msg.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{msg.title}</h4>
                    {getStatusBadge(msg.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{msg.message}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Sent to {msg.recipientCount.toLocaleString()} users</span>
                    <span>{new Date(msg.sentAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Message History Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>All Broadcast Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell className="font-medium">{msg.title}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate">{msg.message}</p>
                    </TableCell>
                    <TableCell>{msg.recipientCount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(msg.sentAt).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(msg.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
