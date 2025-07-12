"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

type User = {
  id: string
  name: string
  email: string
  role: "user" | "admin"
  photo?: string
  location?: string
  skillsOffered: string[]
  skillsWanted: string[]
  availability: string[]
  isPublic: boolean
  rating: number
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate checking for existing session
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate login - in real app, this would call an API
    if (email === "admin@example.com" && password === "admin") {
      const adminUser: User = {
        id: "1",
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        skillsOffered: [],
        skillsWanted: [],
        availability: [],
        isPublic: false,
        rating: 5,
      }
      setUser(adminUser)
      localStorage.setItem("user", JSON.stringify(adminUser))
      return true
    } else if (email === "user@example.com" && password === "user") {
      const regularUser: User = {
        id: "2",
        name: "John Doe",
        email: "user@example.com",
        role: "user",
        photo: "/placeholder.svg?height=100&width=100",
        location: "New York, NY",
        skillsOffered: ["JavaScript", "React", "Node.js"],
        skillsWanted: ["Python", "Machine Learning"],
        availability: ["Evenings", "Weekends"],
        isPublic: true,
        rating: 4.5,
      }
      setUser(regularUser)
      localStorage.setItem("user", JSON.stringify(regularUser))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, isLoading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
