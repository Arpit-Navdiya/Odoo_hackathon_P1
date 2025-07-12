"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { Loader2, Send } from "lucide-react"

type User = {
  _id: string
  name: string
  photo?: string | null
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
}

interface SwapRequestModalProps {
  isOpen: boolean
  onClose: () => void
  targetUser: User
  currentUser: User
}

export function SwapRequestModal({ isOpen, onClose, targetUser, currentUser }: SwapRequestModalProps) {
  const [mySkill, setMySkill] = useState("")
  const [theirSkill, setTheirSkill] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!mySkill || !theirSkill) {
      toast({
        title: "Error",
        description: "Please select both skills for the exchange",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSending(true)

      // Find the skill IDs
      const mySkillData = currentUser.skillsOffered.find(s => s.skill && s.skill.name === mySkill)
      const theirSkillData = targetUser.skillsOffered.find(s => s.skill && s.skill.name === theirSkill)

      if (!mySkillData?.skill?._id || !theirSkillData?.skill?._id) {
        toast({
          title: "Error",
          description: "Selected skills not found.",
          variant: "destructive",
        })
        return
      }

      const response = await apiService.createSwapRequest({
        toUser: targetUser._id,
        skillOffered: mySkillData.skill._id,
        skillWanted: theirSkillData.skill._id,
        message: message
      })

      if (response.success) {
        toast({
          title: "Request Sent!",
          description: `Your skill swap request has been sent to ${targetUser.name}`,
        })

        onClose()
        setMySkill("")
        setTheirSkill("")
        setMessage("")
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send swap request",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const formatSkills = (skills: User['skillsOffered'] | User['skillsWanted']) => {
    return skills.map(item => item.skill.name)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Skill Swap Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
            <Avatar>
              <AvatarImage src={targetUser.photo || "/placeholder.svg"} alt={targetUser.name} />
              <AvatarFallback>{targetUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{targetUser.name}</h3>
              <p className="text-sm text-muted-foreground">Skill swap request</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your skill to offer:</label>
              <Select value={mySkill} onValueChange={setMySkill}>
                <SelectTrigger>
                  <SelectValue placeholder="Select one of your skills" />
                </SelectTrigger>
                <SelectContent>
                  {currentUser.skillsOffered.length > 0 ? (
                    formatSkills(currentUser.skillsOffered).map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-skills" disabled>
                      No skills offered
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Skill you want to learn:</label>
              <Select value={theirSkill} onValueChange={setTheirSkill}>
                <SelectTrigger>
                  <SelectValue placeholder="Select their skill you want" />
                </SelectTrigger>
                <SelectContent>
                  {targetUser.skillsOffered.length > 0 ? (
                    formatSkills(targetUser.skillsOffered).map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-skills" disabled>
                      No skills offered
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Optional message:</label>
              <Textarea
                placeholder="Add a personal message to introduce yourself..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
