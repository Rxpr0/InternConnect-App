import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjqjqjqjqjqjqjqjqjqj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTYyMzkwMjIsImV4cCI6MTkzMTgxNTAyMn0.YOUR_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: Request) {
  try {
    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return new Response(JSON.stringify({ 
        error: 'Authentication error',
        details: sessionError.message 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!session) {
      console.error('No session found')
      return new Response(JSON.stringify({ 
        error: 'Not authenticated',
        details: 'No active session found'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get user's role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return new Response(JSON.stringify({ 
        error: 'Profile error',
        details: profileError.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!profile) {
      console.error('No profile found for user:', session.user.id)
      return new Response(JSON.stringify({ 
        error: 'Profile not found',
        details: 'No profile exists for this user'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Fetch the appropriate profile based on role
    let profileData
    if (profile.role === 'company') {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Company profile fetch error:', error)
        return new Response(JSON.stringify({ 
          error: 'Company profile error',
          details: error.message
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      profileData = data
    } else if (profile.role === 'intern') {
      const { data, error } = await supabase
        .from('intern_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Intern profile fetch error:', error)
        return new Response(JSON.stringify({ 
          error: 'Intern profile error',
          details: error.message
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      profileData = data
    } else {
      console.error('Invalid role:', profile.role)
      return new Response(JSON.stringify({ 
        error: 'Invalid role',
        details: `Unsupported role: ${profile.role}`
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!profileData) {
      console.error('No profile data found for user:', session.user.id)
      return new Response(JSON.stringify({ 
        error: 'Profile data not found',
        details: 'No profile data exists for this user'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Return the profile data
    return new Response(JSON.stringify(profileData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'An unknown error occurred'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function PUT(request: Request) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 })
    }

    const body = await request.json()
    let updateError

    if (profile.role === 'company') {
      const { error } = await supabase
        .from('company_profiles')
        .update(body)
        .eq('id', session.user.id)
      updateError = error
    } else if (profile.role === 'intern') {
      const { error } = await supabase
        .from('intern_profiles')
        .update(body)
        .eq('id', session.user.id)
      updateError = error
    }

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 })
    }

    const body = await request.json()
    let updateError

    if (profile.role === 'company') {
      const { error } = await supabase
        .from('company_profiles')
        .update(body)
        .eq('id', session.user.id)
      updateError = error
    } else if (profile.role === 'intern') {
      const { error } = await supabase
        .from('intern_profiles')
        .update(body)
        .eq('id', session.user.id)
      updateError = error
    }

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}

// Default export for the API route
export default async function handler(req: Request) {
  switch (req.method) {
    case 'GET':
      return GET(req)
    case 'PUT':
      return PUT(req)
    case 'PATCH':
      return PATCH(req)
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
} 