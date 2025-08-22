'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserData {
  id: string
  email: string
  name: string
  department: string
  role: string
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  const fetchUserData = async () => {
    try {
      console.log('AuthProvider: Fetching user data...')
      
      const response = await fetch('/api/auth/me')
      console.log('AuthProvider: API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('AuthProvider: API response data:', data)
        
        if (data.user) {
          setUserData(data.user)
          console.log('AuthProvider: User data set successfully:', data.user)
        } else {
          console.log('AuthProvider: No user data in response')
          setUserData(null)
        }
      } else {
        console.log('AuthProvider: API call failed with status:', response.status)
        setUserData(null)
      }
    } catch (error) {
      console.error('AuthProvider: Error fetching user data:', error)
      setUserData(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        await fetchUserData()
      } else {
        setUserData(null)
        setLoading(false)
      }
    } catch (error) {
      console.error('AuthProvider: Error refreshing user:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Initializing authentication...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('AuthProvider: Session check:', { hasSession: !!session, error })
        
        if (error) {
          console.error('AuthProvider: Session error:', error)
          if (mounted) setLoading(false)
          return
        }

        if (session?.user && mounted) {
          console.log('AuthProvider: User session found:', session.user.email)
          setUser(session.user)
          await fetchUserData()
        } else {
          console.log('AuthProvider: No session found')
          if (mounted) setLoading(false)
        }
      } catch (error) {
        console.error('AuthProvider: Initialize error:', error)
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state changed:', event)
      
      if (mounted) {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserData()
        } else {
          setUserData(null)
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signOut = async () => {
    try {
      console.log('AuthProvider: Signing out...')
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('AuthProvider: Sign out error:', error)
      }
      
      setUser(null)
      setUserData(null)
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
      }
      
      console.log('AuthProvider: Sign out completed')
    } catch (error) {
      console.error('AuthProvider: Sign out error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}