"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { SwapRequestModal } from "@/components/swap-request-modal"

// Mock data for users
const mockUsers = [
  {
    id: "1",
    name: "Alice Johnson",
    photo: "/placeholder.svg?height=100&width=100",
    skillsOffered: ["Python", "Data Science", "Machine Learning"],
    skillsWanted: ["JavaScript", "React"],
    availability: ["Evenings", "Weekends"],
    rating: 4.8,
    location: "San Francisco, CA",
  },
  {
    id: "2",
    name: "Bob Smith",
    photo: "/placeholder.svg?height=100&width=100",
    skillsOffered: ["JavaScript", "React", "Node.js"],
    skillsWanted: ["Python", "DevOps"],
    availability: ["Weekdays", "Evenings"],
    rating: 4.6,
    location: "New York, NY",
  },
  {
    id: "3",
    name: "Carol Davis",
    photo: "/placeholder.svg?height=100&width=100",
    skillsOffered: ["UI/UX Design", "Figma", "Adobe Creative Suite"],
    skillsWanted: ["Frontend Development", "CSS"],
    availability: ["Weekends"],
    rating: 4.9,
    location: "Los Angeles, CA",
  },
  {
    id: "4",
    name: "David Wilson",
    photo: "/placeholder.svg?height=100&width=100",
    skillsOffered: ["DevOps", "AWS", "Docker"],
    skillsWanted: ["Kubernetes", "Terraform"],
    availability: ["Evenings"],
    rating: 4.7,
    location: "Seattle, WA",
  },
  {
    id: "5",
    name: "Eva Martinez",
    photo: "/placeholder.svg?height=100&width=100",
    skillsOffered: ["Digital Marketing", "SEO", "Content Writing"],
    skillsWanted: ["Social Media Management", "Analytics"],
    availability: ["Weekdays", "Weekends"],
    rating: 4.5,
    location: "Austin, TX",
  },
  {
    id: "6",
    name: "Frank Chen",
    photo: "/placeholder.svg?height=100&width=100",
    skillsOffered: ["Mobile Development", "React Native", "Flutter"],
    skillsWanted: ["Backend Development", "Database Design"],
    availability: ["Evenings", "Weekends"],
    rating: 4.8,
    location: "Portland, OR",
  },
]

export default function HomePage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState("All Availability")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<(typeof mockUsers)[0] | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)

  const itemsPerPage = 4

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.skillsOffered.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.skillsWanted.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesAvailability =
      availabilityFilter === "All Availability" || user.availability.includes(availabilityFilter)

    return matchesSearch && matchesAvailability
  })

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  const handleRequestClick = (targetUser: (typeof mockUsers)[0]) => {
    if (!user) return
    setSelectedUser(targetUser)
    setShowRequestModal(true)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Skill Directory</h1>
          <p className="text-muted-foreground">Discover talented individuals and exchange skills with your community</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search skills or names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Availability">All Availability</SelectItem>
              <SelectItem value="Weekends">Weekends</SelectItem>
              <SelectItem value="Evenings">Evenings</SelectItem>
              <SelectItem value="Weekdays">Weekdays</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {paginatedUsers.map((profileUser) => (
            <Card key={profileUser.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-4">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarImage src={profileUser.photo || "/placeholder.svg"} alt={profileUser.name} />
                  <AvatarFallback>{profileUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">{profileUser.name}</h3>
                <p className="text-sm text-muted-foreground">{profileUser.location}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2 text-green-700">Skills Offered</h4>
                  <div className="flex flex-wrap gap-1">
                    {profileUser.skillsOffered.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2 text-blue-700">Skills Wanted</h4>
                  <div className="flex flex-wrap gap-1">
                    {profileUser.skillsWanted.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Availability</h4>
                  <div className="flex flex-wrap gap-1">
                    {profileUser.availability.map((time) => (
                      <Badge key={time} variant="default" className="text-xs">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {renderStars(profileUser.rating)}
                    <span className="text-sm text-muted-foreground ml-1">{profileUser.rating}</span>
                  </div>

                  <Button size="sm" onClick={() => handleRequestClick(profileUser)} disabled={!user}>
                    Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {!user && (
          <div className="text-center mt-8 p-6 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground mb-4">Please log in to send skill swap requests</p>
            <Button asChild>
              <a href="/login">Login to Get Started</a>
            </Button>
          </div>
        )}
      </main>

      {/* Swap Request Modal */}
      {showRequestModal && selectedUser && user && (
        <SwapRequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          targetUser={selectedUser}
          currentUser={user}
        />
      )}
    </div>
  )
}
