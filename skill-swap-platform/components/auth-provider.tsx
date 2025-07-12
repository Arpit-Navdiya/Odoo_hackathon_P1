"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { apiService, type AuthResponse } from "@/lib/api"

type User = {
  _id: string
  name: string
  email: string
  role: "user" | "admin"
  photo?: string | null
  location?: string
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
  availability: string[]
  isPublic: boolean
  rating: {
    average: number
    count: number
  }
  preferences: {
    emailNotifications: boolean
    pushNotifications: boolean
  }
  lastActive: string
  createdAt: string
  updatedAt: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
  refreshUser: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on app load
    const initializeAuth = async () => {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log("Not in browser environment, skipping auth initialization")
        setIsLoading(false)
        return
      }

      const savedToken = localStorage.getItem("token")
      const savedUser = localStorage.getItem("user")
      
      console.log("Initializing auth with saved token:", !!savedToken, "saved user:", !!savedUser)
      
      if (savedToken && savedUser) {
        try {
          // Set token in API service first
          apiService.setToken(savedToken)
          
          // Validate token with server
          const currentUser = await apiService.getCurrentUser()
          
          if (currentUser) {
            console.log("Token validation successful, setting user:", currentUser.name)
            setUser(currentUser)
            setToken(savedToken)
            // Update localStorage with fresh user data
            localStorage.setItem("user", JSON.stringify(currentUser))
          } else {
            // Token is invalid, clear everything
            throw new Error("Invalid token")
          }
        } catch (error) {
          console.error("Error validating saved session:", error)
          
          // Try to use saved user data as fallback if it's recent (within 24 hours)
          try {
            const parsedUser = JSON.parse(savedUser)
            const userAge = Date.now() - new Date(parsedUser.lastActive || 0).getTime()
            const maxAge = 24 * 60 * 60 * 1000 // 24 hours
            
            if (userAge < maxAge) {
              console.log("Using saved user data as fallback")
              setUser(parsedUser)
              setToken(savedToken)
              apiService.setToken(savedToken)
            } else {
              throw new Error("Saved user data too old")
            }
          } catch (fallbackError) {
            console.error("Fallback failed, clearing auth data:", fallbackError)
            // Clear invalid data
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            apiService.setToken(null)
            setUser(null)
            setToken(null)
          }
        }
      } else {
        console.log("No saved auth data found")
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response: AuthResponse = await apiService.login({ email, password })
      
      if (response.success) {
        // Convert API user format to our User type
        const userData: User = {
          _id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          photo: response.user.photo,
          location: response.user.location,
          skillsOffered: response.user.skillsOffered,
          skillsWanted: response.user.skillsWanted,
          availability: response.user.availability,
          isPublic: response.user.isPublic,
          rating: response.user.rating,
          preferences: {
            emailNotifications: true,
            pushNotifications: true
          },
          lastActive: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        console.log("Login successful, setting user:", userData.name)
        setUser(userData)
        setToken(response.token)
        
        // Store in localStorage
        localStorage.setItem("token", response.token)
        localStorage.setItem("user", JSON.stringify(userData))
        
        // Sync token with API service
        apiService.setToken(response.token)
        
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response: AuthResponse = await apiService.register({ name, email, password })
      
      if (response.success) {
        // Convert API user format to our User type
        const userData: User = {
          _id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          photo: response.user.photo,
          location: response.user.location,
          skillsOffered: response.user.skillsOffered,
          skillsWanted: response.user.skillsWanted,
          availability: response.user.availability,
          isPublic: response.user.isPublic,
          rating: response.user.rating,
          preferences: {
            emailNotifications: true,
            pushNotifications: true
          },
          lastActive: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        console.log("Registration successful, setting user:", userData.name)
        setUser(userData)
        setToken(response.token)
        
        // Store in localStorage
        localStorage.setItem("token", response.token)
        localStorage.setItem("user", JSON.stringify(userData))
        
        // Sync token with API service
        apiService.setToken(response.token)
        
        return true
      }
      return false
    } catch (error) {
      console.error("Register error:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    // Clear token from API service
    apiService.setToken(null)
  }

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  const refreshUser = async () => {
    try {
      const currentUser = await apiService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        localStorage.setItem("user", JSON.stringify(currentUser))
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
      
      // If it's an authentication error (401/403), then we should logout
      if (error instanceof Error && (
        error.message.includes('401') || 
        error.message.includes('403') || 
        error.message.includes('Not authorized')
      )) {
        logout()
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateProfile, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
