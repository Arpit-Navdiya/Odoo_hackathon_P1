"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Search, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { SwapRequestModal } from "@/components/swap-request-modal"
import { apiService, type User } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function HomePage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState("All Availability")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  
  // API state
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  const itemsPerPage = 12

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }

      if (availabilityFilter !== "All Availability") {
        params.availability = availabilityFilter
      }

      const response = await apiService.getUsers(params)
      
      setUsers(response.users)
      setTotalPages(response.pagination.pages)
      setTotalUsers(response.total)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch users when dependencies change
  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm, availabilityFilter])

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, availabilityFilter])

  const handleRequestClick = (targetUser: User) => {
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

  const formatSkills = (skills: User['skillsOffered'] | User['skillsWanted']) => {
    if (!skills || !Array.isArray(skills)) return []
    
    return skills
      .filter(item => item && item.skill && item.skill.name) // Filter out null/undefined items and skills
      .map(item => item.skill.name)
  }

  const getAvailabilityText = (availability: string[]) => {
    if (availability.length === 0) return ['Not specified']
    return availability.map(avail => 
      avail.charAt(0).toUpperCase() + avail.slice(1)
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4"
                onClick={fetchUsers}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
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
              <SelectItem value="weekends">Weekends</SelectItem>
              <SelectItem value="evenings">Evenings</SelectItem>
              <SelectItem value="weekdays">Weekdays</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading users...</span>
          </div>
        )}

        {/* No Results */}
        {!isLoading && users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              {searchTerm || availabilityFilter !== "All Availability" 
                ? "No users found matching your criteria" 
                : "No users available at the moment"}
            </p>
            {(searchTerm || availabilityFilter !== "All Availability") && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setAvailabilityFilter("All Availability")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* User Cards Grid */}
        {!isLoading && users.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {users.map((profileUser) => (
                <Card key={profileUser._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center pb-4">
                    <Avatar className="h-20 w-20 mx-auto mb-4">
                      <AvatarImage 
                        src={profileUser.photo || "/placeholder.svg"} 
                        alt={profileUser.name} 
                      />
                      <AvatarFallback>{profileUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg">{profileUser.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {profileUser.location || "Location not specified"}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-green-700">Skills Offered</h4>
                      <div className="flex flex-wrap gap-1">
                        {profileUser.skillsOffered.length > 0 ? (
                          formatSkills(profileUser.skillsOffered).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No skills offered</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2 text-blue-700">Skills Wanted</h4>
                      <div className="flex flex-wrap gap-1">
                        {profileUser.skillsWanted.length > 0 ? (
                          formatSkills(profileUser.skillsWanted).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No skills wanted</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Availability</h4>
                      <div className="flex flex-wrap gap-1">
                        {getAvailabilityText(profileUser.availability).map((time) => (
                          <Badge key={time} variant="default" className="text-xs">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {renderStars(profileUser.rating.average)}
                        <span className="text-sm text-muted-foreground ml-1">
                          {profileUser.rating.average.toFixed(1)} ({profileUser.rating.count})
                        </span>
                      </div>

                      <Button 
                        size="sm" 
                        onClick={() => handleRequestClick(profileUser)} 
                        disabled={!user || user._id === profileUser._id}
                      >
                        {user?._id === profileUser._id ? 'Your Profile' : 'Request'}
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

            {/* Results count */}
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Showing {users.length} of {totalUsers} users
            </div>
          </>
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
