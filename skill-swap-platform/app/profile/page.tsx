"use client"

import { useState, useEffect, useRef } from "react"
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
import { apiService, type Skill } from "@/lib/api"
import { X, Plus, Upload, Loader2, AlertCircle, Camera } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  
  // API state
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)



  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    // Load user data
    setFormData({
      name: user.name || "",
      location: user.location || "",
      photo: user.photo || "",
      skillsOffered: (user.skillsOffered || [])
        .filter(item => item && item.skill && item.skill.name)
        .map(item => item.skill.name) || [],
      skillsWanted: (user.skillsWanted || [])
        .filter(item => item && item.skill && item.skill.name)
        .map(item => item.skill.name) || [],
      availability: user.availability || [],
      isPublic: user.isPublic,
    })
  }, [user, router])

  const availabilityOptions = ["weekdays", "evenings", "weekends"]

  const handleAvailabilityChange = (option: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      availability: checked ? [...prev.availability, option] : prev.availability.filter((item) => item !== option),
    }))
  }

  const addSkillOffered = async () => {
    const skillToAdd = newSkillOffered.trim()
    
    if (!skillToAdd || formData.skillsOffered.includes(skillToAdd)) {
      return
    }

    try {
      const response = await apiService.addSkillDirect(skillToAdd, 'offered')

      if (response.success) {
        setFormData((prev) => ({
          ...prev,
          skillsOffered: [...prev.skillsOffered, skillToAdd],
        }))
        setNewSkillOffered("")
        
        // Update local user state with the new skill
        if (user) {
          const updatedUser = {
            ...user,
            skillsOffered: [...user.skillsOffered, {
              skill: {
                _id: response.skill._id,
                name: response.skill.name,
                category: response.skill.category
              },
              level: 'intermediate'
            }]
          }
          updateProfile(updatedUser)
        }

        toast({
          title: "Skill Added",
          description: `${skillToAdd} has been added to your offered skills.`,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add skill"
      
      // Handle duplicate skill error specifically
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        toast({
          title: "Skill Already Exists",
          description: `${skillToAdd} is already in your offered skills.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  const addSkillWanted = async () => {
    const skillToAdd = newSkillWanted.trim()
    
    if (!skillToAdd || formData.skillsWanted.includes(skillToAdd)) {
      return
    }

    try {
      const response = await apiService.addSkillDirect(skillToAdd, 'wanted')

      if (response.success) {
        setFormData((prev) => ({
          ...prev,
          skillsWanted: [...prev.skillsWanted, skillToAdd],
        }))
        setNewSkillWanted("")
        
        // Update local user state with the new skill
        if (user) {
          const updatedUser = {
            ...user,
            skillsWanted: [...user.skillsWanted, {
              skill: {
                _id: response.skill._id,
                name: response.skill.name,
                category: response.skill.category
              },
              level: 'medium'
            }]
          }
          updateProfile(updatedUser)
        }

        toast({
          title: "Skill Added",
          description: `${skillToAdd} has been added to your wanted skills.`,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add skill"
      
      // Handle duplicate skill error specifically
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        toast({
          title: "Skill Already Exists",
          description: `${skillToAdd} is already in your wanted skills.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  const removeSkillOffered = async (skillName: string) => {
    try {
      // Find the skill ID from user's skills
      const skillToRemove = user?.skillsOffered.find(s => s.skill && s.skill.name === skillName)
      if (!skillToRemove || !skillToRemove.skill || !skillToRemove.skill._id) {
        toast({
          title: "Error",
          description: "Skill not found or invalid skill data",
          variant: "destructive",
        })
        return
      }

      const response = await apiService.removeSkill(skillToRemove.skill._id, 'offered')

      if (response.success) {
        setFormData((prev) => ({
          ...prev,
          skillsOffered: prev.skillsOffered.filter((s) => s !== skillName),
        }))
        
        // Update local user state by removing the skill
        if (user) {
          const updatedUser = {
            ...user,
            skillsOffered: user.skillsOffered.filter(s => s.skill && s.skill.name !== skillName)
          }
          updateProfile(updatedUser)
        }

        toast({
          title: "Skill Removed",
          description: `${skillName} has been removed from your offered skills.`,
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove skill",
        variant: "destructive",
      })
    }
  }

  const removeSkillWanted = async (skillName: string) => {
    try {
      // Find the skill ID from user's skills
      const skillToRemove = user?.skillsWanted.find(s => s.skill && s.skill.name === skillName)
      if (!skillToRemove || !skillToRemove.skill || !skillToRemove.skill._id) {
        toast({
          title: "Error",
          description: "Skill not found or invalid skill data",
          variant: "destructive",
        })
        return
      }

      const response = await apiService.removeSkill(skillToRemove.skill._id, 'wanted')

      if (response.success) {
        setFormData((prev) => ({
          ...prev,
          skillsWanted: prev.skillsWanted.filter((s) => s !== skillName),
        }))
        
        // Update local user state by removing the skill
        if (user) {
          const updatedUser = {
            ...user,
            skillsWanted: user.skillsWanted.filter(s => s.skill && s.skill.name !== skillName)
          }
          updateProfile(updatedUser)
        }

        toast({
          title: "Skill Removed",
          description: `${skillName} has been removed from your wanted skills.`,
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove skill",
        variant: "destructive",
      })
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploadingPhoto(true)
      setError(null)

      const response = await apiService.uploadProfilePhoto(file)

      if (response.success) {
        // Update form data with new photo URL
        setFormData(prev => ({
          ...prev,
          photo: response.photoUrl
        }))

        // Update local user state
        if (user) {
          const updatedUser = {
            ...user,
            photo: response.photoUrl
          }
          updateProfile(updatedUser)
        }

        toast({
          title: "Photo Updated",
          description: "Your profile photo has been updated successfully.",
        })
      }
    } catch (err) {
      console.error('Error uploading photo:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
      toast({
        title: "Upload Failed",
        description: err instanceof Error ? err.message : "Failed to upload photo",
        variant: "destructive",
      })
    } finally {
      setIsUploadingPhoto(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await apiService.updateProfile({
        name: formData.name,
        location: formData.location,
        skillsOffered: formData.skillsOffered,
        skillsWanted: formData.skillsWanted,
        availability: formData.availability,
        isPublic: formData.isPublic,
      })

      if (response.success) {
        // Update local user state with the response data
        const updatedUser = {
          ...user!,
          name: response.user.name,
          location: response.user.location,
          skillsOffered: response.user.skillsOffered,
          skillsWanted: response.user.skillsWanted,
          availability: response.user.availability,
          isPublic: response.user.isPublic,
        }
        updateProfile(updatedUser)

        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        })
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        location: user.location || "",
        photo: user.photo || "",
        skillsOffered: (user.skillsOffered || [])
          .filter(item => item && item.skill && item.skill.name)
          .map(item => item.skill.name) || [],
        skillsWanted: (user.skillsWanted || [])
          .filter(item => item && item.skill && item.skill.name)
          .map(item => item.skill.name) || [],
        availability: user.availability || [],
        isPublic: user.isPublic,
      })
    }
    setError(null)
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
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2 h-auto p-0 text-destructive hover:text-destructive"
                    onClick={() => setError(null)}
                  >
                    ×
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Profile Photo */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={formData.photo || "/placeholder.svg"} alt={formData.name} />
                  <AvatarFallback>{formData.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {isUploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isUploadingPhoto ? "Uploading..." : "Upload Photo"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, GIF up to 5MB
                </p>
              </div>
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
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeSkillOffered(skill)} 
                    />
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
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeSkillWanted(skill)} 
                    />
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
                    <Label htmlFor={option} className="capitalize">{option}</Label>
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
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
