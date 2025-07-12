const API_BASE_URL = 'https://d906jpcl-3001.inc1.devtunnels.ms/api'

export interface User {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  photo?: string | null
  location?: string
  availability: string[]
  isPublic: boolean
  status: string
  emailVerified: boolean
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

export interface UsersResponse {
  success: boolean
  count: number
  total: number
  pagination: {
    page: number
    limit: number
    pages: number
  }
  users: User[]
}

export interface AuthResponse {
  success: boolean
  message: string
  token: string
  user: {
    id: string
    name: string
    email: string
    role: 'user' | 'admin'
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
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface ProfileUpdateRequest {
  name?: string
  location?: string
  skillsOffered?: string[]
  skillsWanted?: string[]
  availability?: string[]
  isPublic?: boolean
}

export interface SkillAddRequest {
  skillName: string
  type: 'offered' | 'wanted'
  proficiencyLevel?: string
  urgency?: string
  category?: string
}

export interface ProfilePhotoResponse {
  success: boolean
  message: string
  photoUrl: string
}

export interface SwapRequest {
  _id: string
  fromUser: {
    _id: string
    name: string
    photo?: string
  }
  toUser: {
    _id: string
    name: string
    photo?: string
  }
  skillOffered: {
    _id: string
    name: string
  }
  skillWanted: {
    _id: string
    name: string
  }
  message: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface SwapRequestResponse {
  success: boolean
  count: number
  total: number
  pagination: {
    page: number
    limit: number
    pages: number
  }
  swapRequests: SwapRequest[]
}

export interface CreateSwapRequestRequest {
  toUser: string
  skillOffered: string
  skillWanted: string
  message?: string
}

export interface SwapRequestActionRequest {
  action: 'accept' | 'reject' | 'complete' | 'cancel'
  message?: string
}

export interface Skill {
  _id: string
  name: string
  category: string
  description?: string
  tags?: string[]
  status: string
  popularity: {
    offeredCount: number
    wantedCount: number
  }
  submittedBy: {
    _id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export interface SkillsResponse {
  success: boolean
  count: number
  total: number
  pagination: {
    page: number
    limit: number
    pages: number
  }
  skills: Skill[]
}

export interface ApiError {
  message: string
  status?: number
}

class ApiService {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = API_BASE_URL
    // Try to get token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token')
    }
  }

  setToken(token: string | null) {
    this.token = token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('API service can only be used in browser environment')
    }

    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add authorization header if token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    // Merge with any additional headers from options
    if (options.headers) {
      Object.assign(headers, options.headers)
    }
    
    const config: RequestInit = {
      headers,
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred')
    }
  }

  private async uploadRequest<T>(endpoint: string, formData: FormData): Promise<T> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('API service can only be used in browser environment')
    }

    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {}

    // Add authorization header if token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    
    const config: RequestInit = {
      headers,
      method: 'POST',
      body: formData,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred')
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    
    // Set token after successful login
    if (response.success) {
      this.setToken(response.token)
    }
    
    return response
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    
    // Set token after successful registration
    if (response.success) {
      this.setToken(response.token)
    }
    
    return response
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ success: boolean; user: User }>('/auth/me')
    return response.user
  }

  async updateProfile(profileData: ProfileUpdateRequest): Promise<{ success: boolean; message: string; user: User }> {
    return this.request<{ success: boolean; message: string; user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  }

  async uploadProfilePhoto(file: File): Promise<ProfilePhotoResponse> {
    const formData = new FormData()
    formData.append('photo', file)
    
    return this.uploadRequest<ProfilePhotoResponse>('/users/profile-photo', formData)
  }

  async addSkillDirect(skillName: string, type: 'offered' | 'wanted'): Promise<{ success: boolean; message: string; skill: Skill }> {
    return this.request<{ success: boolean; message: string; skill: Skill }>('/users/skills', {
      method: 'POST',
      body: JSON.stringify({
        skillName,
        type,
        category: 'other' // Default category for direct skill addition
      }),
    })
  }

  async addSkill(skillData: SkillAddRequest): Promise<{ success: boolean; message: string; skill: Skill }> {
    return this.request<{ success: boolean; message: string; skill: Skill }>('/users/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    })
  }

  async removeSkill(skillId: string, type: 'offered' | 'wanted'): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/users/skills/${skillId}?type=${type}`, {
      method: 'DELETE',
    })
  }

  async getSkills(params: {
    page?: number
    limit?: number
    category?: string
    search?: string
    sortBy?: string
  } = {}): Promise<SkillsResponse> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    const endpoint = `/skills${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    return this.request<SkillsResponse>(endpoint)
  }

  async getSkillCategories(): Promise<{ success: boolean; categories: Array<{ category: string; count: number }> }> {
    return this.request<{ success: boolean; categories: Array<{ category: string; count: number }> }>('/skills/meta/categories')
  }

  async getUsers(params: {
    page?: number
    limit?: number
    search?: string
    availability?: string
    skillCategory?: string
    location?: string
  } = {}): Promise<UsersResponse> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    const endpoint = `/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    return this.request<UsersResponse>(endpoint)
  }

  // Swap Request APIs
  async createSwapRequest(data: CreateSwapRequestRequest): Promise<{ success: boolean; message: string; swapRequest: SwapRequest }> {
    return this.request<{ success: boolean; message: string; swapRequest: SwapRequest }>('/swaps', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getSwapRequests(params: {
    page?: number
    limit?: number
    type?: 'sent' | 'received'
    status?: string
  } = {}): Promise<SwapRequestResponse> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    const endpoint = `/swaps${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    return this.request<SwapRequestResponse>(endpoint)
  }

  async getSwapRequest(id: string): Promise<{ success: boolean; swapRequest: SwapRequest }> {
    return this.request<{ success: boolean; swapRequest: SwapRequest }>(`/swaps/${id}`)
  }

  async updateSwapRequest(id: string, action: SwapRequestActionRequest): Promise<{ success: boolean; message: string; swapRequest: SwapRequest }> {
    let endpoint = `/swaps/${id}`
    
    switch (action.action) {
      case 'accept':
        endpoint = `/swaps/${id}/accept`
        break
      case 'reject':
        endpoint = `/swaps/${id}/reject`
        break
      case 'complete':
        endpoint = `/swaps/${id}/complete`
        break
      default:
        throw new Error(`Invalid action: ${action.action}`)
    }
    
    return this.request<{ success: boolean; message: string; swapRequest: SwapRequest }>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(action),
    })
  }

  async deleteSwapRequest(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/swaps/${id}`, {
      method: 'DELETE',
    })
  }

  // Admin APIs
  async getAdminDashboard(): Promise<{
    success: boolean
    stats: {
      users: { total: number; active: number; banned: number }
      swaps: { total: number; pending: number; completed: number }
      skills: { total: number; pending: number; flagged: number }
    }
    recentActivity: {
      swaps: Array<{
        _id: string
        fromUser: { _id: string; name: string }
        toUser: { _id: string; name: string }
        skillOffered: { _id: string; name: string }
        skillWanted: { _id: string; name: string }
        status: string
        createdAt: string
      }>
      users: Array<{
        _id: string
        name: string
        email: string
        createdAt: string
      }>
    }
  }> {
    return this.request<{
      success: boolean
      stats: {
        users: { total: number; active: number; banned: number }
        swaps: { total: number; pending: number; completed: number }
        skills: { total: number; pending: number; flagged: number }
      }
      recentActivity: {
        swaps: Array<{
          _id: string
          fromUser: { _id: string; name: string }
          toUser: { _id: string; name: string }
          skillOffered: { _id: string; name: string }
          skillWanted: { _id: string; name: string }
          status: string
          createdAt: string
        }>
        users: Array<{
          _id: string
          name: string
          email: string
          createdAt: string
        }>
      }
    }>('/admin/dashboard')
  }

  async getAdminSwaps(params: {
    page?: number
    limit?: number
    status?: string
    dateFrom?: string
    dateTo?: string
    search?: string
  } = {}): Promise<{
    success: boolean
    count: number
    total: number
    pagination: {
      page: number
      limit: number
      pages: number
    }
    swaps: Array<{
      _id: string
      fromUser: {
        _id: string
        name: string
        email: string
      }
      toUser: {
        _id: string
        name: string
        email: string
      }
      skillOffered: {
        _id: string
        name: string
        category: string
      }
      skillWanted: {
        _id: string
        name: string
        category: string
      }
      message: string
      status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
      createdAt: string
      updatedAt: string
    }>
  }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    const endpoint = `/admin/swaps${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    return this.request<{
      success: boolean
      count: number
      total: number
      pagination: {
        page: number
        limit: number
        pages: number
      }
      swaps: Array<{
        _id: string
        fromUser: {
          _id: string
          name: string
          email: string
        }
        toUser: {
          _id: string
          name: string
          email: string
        }
        skillOffered: {
          _id: string
          name: string
          category: string
        }
        skillWanted: {
          _id: string
          name: string
          category: string
        }
        message: string
        status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
        createdAt: string
        updatedAt: string
      }>
    }>(endpoint)
  }

  async getAdminUsers(params: {
    page?: number
    limit?: number
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: string
  } = {}): Promise<{
    success: boolean
    count: number
    total: number
    pagination: {
      page: number
      limit: number
      pages: number
    }
    users: Array<{
      _id: string
      name: string
      email: string
      role: 'user' | 'admin'
      photo?: string | null
      location?: string
      status: 'active' | 'banned' | 'suspended'
      emailVerified: boolean
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
      rating: {
        average: number
        count: number
      }
      lastActive: string
      createdAt: string
      updatedAt: string
    }>
  }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    const endpoint = `/admin/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    return this.request<{
      success: boolean
      count: number
      total: number
      pagination: {
        page: number
        limit: number
        pages: number
      }
      users: Array<{
        _id: string
        name: string
        email: string
        role: 'user' | 'admin'
        photo?: string | null
        location?: string
        status: 'active' | 'banned' | 'suspended'
        emailVerified: boolean
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
        rating: {
          average: number
          count: number
        }
        lastActive: string
        createdAt: string
        updatedAt: string
      }>
    }>(endpoint)
  }

  async updateUserStatus(userId: string, status: 'active' | 'banned' | 'suspended'): Promise<{
    success: boolean
    message: string
    user: {
      _id: string
      name: string
      email: string
      role: 'user' | 'admin'
      photo?: string | null
      location?: string
      status: 'active' | 'banned' | 'suspended'
      emailVerified: boolean
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
      rating: {
        average: number
        count: number
      }
      lastActive: string
      createdAt: string
      updatedAt: string
    }
  }> {
    return this.request<{
      success: boolean
      message: string
      user: {
        _id: string
        name: string
        email: string
        role: 'user' | 'admin'
        photo?: string | null
        location?: string
        status: 'active' | 'banned' | 'suspended'
        emailVerified: boolean
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
        rating: {
          average: number
          count: number
        }
        lastActive: string
        createdAt: string
        updatedAt: string
      }
    }>(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  async getAdminSkills(params: {
    page?: number
    limit?: number
    status?: string
    flagged?: string
  } = {}): Promise<{
    success: boolean
    count: number
    total: number
    pagination: {
      page: number
      limit: number
      pages: number
    }
    skills: Array<{
      _id: string
      name: string
      category: string
      description?: string
      tags?: string[]
      status: 'pending' | 'approved' | 'rejected'
      flagged: boolean
      flagReason?: string
      popularity: {
        offeredCount: number
        wantedCount: number
      }
      submittedBy: {
        _id: string
        name: string
        email: string
      }
      moderatedBy?: {
        _id: string
        name: string
      }
      createdAt: string
      updatedAt: string
      moderatedAt?: string
    }>
  }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    const endpoint = `/admin/skills${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    return this.request<{
      success: boolean
      count: number
      total: number
      pagination: {
        page: number
        limit: number
        pages: number
      }
      skills: Array<{
        _id: string
        name: string
        category: string
        description?: string
        tags?: string[]
        status: 'pending' | 'approved' | 'rejected'
        flagged: boolean
        flagReason?: string
        popularity: {
          offeredCount: number
          wantedCount: number
        }
        submittedBy: {
          _id: string
          name: string
          email: string
        }
        moderatedBy?: {
          _id: string
          name: string
        }
        createdAt: string
        updatedAt: string
        moderatedAt?: string
      }>
    }>(endpoint)
  }

  async moderateSkill(skillId: string, action: 'approve' | 'reject', reason?: string): Promise<{
    success: boolean
    message: string
    skill: {
      _id: string
      name: string
      category: string
      description?: string
      tags?: string[]
      status: 'pending' | 'approved' | 'rejected'
      flagged: boolean
      flagReason?: string
      popularity: {
        offeredCount: number
        wantedCount: number
      }
      submittedBy: {
        _id: string
        name: string
        email: string
      }
      moderatedBy?: {
        _id: string
        name: string
      }
      createdAt: string
      updatedAt: string
      moderatedAt?: string
    }
  }> {
    const body: any = { action }
    if (reason) {
      body.reason = reason
    }

    return this.request<{
      success: boolean
      message: string
      skill: {
        _id: string
        name: string
        category: string
        description?: string
        tags?: string[]
        status: 'pending' | 'approved' | 'rejected'
        flagged: boolean
        flagReason?: string
        popularity: {
          offeredCount: number
          wantedCount: number
        }
        submittedBy: {
          _id: string
          name: string
          email: string
        }
        moderatedBy?: {
          _id: string
          name: string
        }
        createdAt: string
        updatedAt: string
        moderatedAt?: string
      }
    }>(`/admin/skills/${skillId}/moderate`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }
}

export const apiService = new ApiService() 