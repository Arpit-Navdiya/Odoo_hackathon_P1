"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { X, Plus, Upload } from "lucide-react"

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    photo: "",
    skillsOffered: [] as string[],
    skillsWanted: [] as string[],
    availability: [] as string[],
    isPublic: true,
  })

  const [newSkillOffered, setNewSkillOffered] = useState("")
  const [newSkillWanted, setNewSkillWanted] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    setFormData({
      name: user.name || "",
      location: user.location || "",
      photo: user.photo || "",
      skillsOffered: user.skillsOffered || [],
      skillsWanted: user.skillsWanted || [],
      availability: user.availability || [],
      isPublic: user.isPublic,
    })
  }, [user, router])

  const availabilityOptions = ["Weekdays", "Evenings", "Weekends"]

  const handleAvailabilityChange = (option: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      availability: checked ? [...prev.availability, option] : prev.availability.filter((item) => item !== option),
    }))
  }

  const addSkillOffered = () => {
    if (newSkillOffered.trim() && !formData.skillsOffered.includes(newSkillOffered.trim())) {
      setFormData((prev) => ({
        ...prev,
        skillsOffered: [...prev.skillsOffered, newSkillOffered.trim()],
      }))
      setNewSkillOffered("")
    }
  }

  const addSkillWanted = () => {
    if (newSkillWanted.trim() && !formData.skillsWanted.includes(newSkillWanted.trim())) {
      setFormData((prev) => ({
        ...prev,
        skillsWanted: [...prev.skillsWanted, newSkillWanted.trim()],
      }))
      setNewSkillWanted("")
    }
  }

  const removeSkillOffered = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skillsOffered: prev.skillsOffered.filter((s) => s !== skill),
    }))
  }

  const removeSkillWanted = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skillsWanted: prev.skillsWanted.filter((s) => s !== skill),
    }))
  }

  const handleSave = () => {
    updateProfile(formData)
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    })
  }

  const handleDiscard = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        location: user.location || "",
        photo: user.photo || "",
        skillsOffered: user.skillsOffered || [],
        skillsWanted: user.skillsWanted || [],
        availability: user.availability || [],
        isPublic: user.isPublic,
      })
    }
    toast({
      title: "Changes Discarded",
      description: "All unsaved changes have been discarded.",
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Photo */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.photo || "/placeholder.svg"} alt={formData.name} />
                <AvatarFallback>{formData.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="City, State"
                />
              </div>
            </div>

            {/* Skills Offered */}
            <div className="space-y-3">
              <Label>Skills Offered</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.skillsOffered.map((skill) => (
                  <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkillOffered(skill)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSkillOffered}
                  onChange={(e) => setNewSkillOffered(e.target.value)}
                  placeholder="Add a skill you can teach"
                  onKeyPress={(e) => e.key === "Enter" && addSkillOffered()}
                />
                <Button type="button" onClick={addSkillOffered} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Skills Wanted */}
            <div className="space-y-3">
              <Label>Skills Wanted</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.skillsWanted.map((skill) => (
                  <Badge key={skill} variant="outline" className="flex items-center gap-1">
                    {skill}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkillWanted(skill)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSkillWanted}
                  onChange={(e) => setNewSkillWanted(e.target.value)}
                  placeholder="Add a skill you want to learn"
                  onKeyPress={(e) => e.key === "Enter" && addSkillWanted()}
                />
                <Button type="button" onClick={addSkillWanted} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-3">
              <Label>Availability</Label>
              <div className="space-y-2">
                {availabilityOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={formData.availability.includes(option)}
                      onCheckedChange={(checked) => handleAvailabilityChange(option, checked as boolean)}
                    />
                    <Label htmlFor={option}>{option}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Profile Visibility</Label>
                <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
              </div>
              <Switch
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublic: checked }))}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleDiscard}>
                Discard
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
