import { createClient } from '@supabase/supabase-js'

const fictionalUsers = [
  {
    email: 'habitmaster@example.com',
    password: 'HabitMaster123!',
    full_name: 'HabitMaster',
    points: 1250,
    avatar_url: null
  },
  {
    email: 'productivitypro@example.com',
    password: 'ProductivityPro123!',
    full_name: 'ProductivityPro',
    points: 980,
    avatar_url: null
  },
  {
    email: 'mindfulmaster@example.com',
    password: 'MindfulMaster123!',
    full_name: 'MindfulMaster',
    points: 875,
    avatar_url: null
  },
  {
    email: 'goalgetter@example.com',
    password: 'GoalGetter123!',
    full_name: 'GoalGetter',
    points: 720,
    avatar_url: null
  },
  {
    email: 'dailyachiever@example.com',
    password: 'DailyAchiever123!',
    full_name: 'DailyAchiever',
    points: 650,
    avatar_url: null
  }
]

export const handler = async () => {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if users already exist
    const { data: existingUsers, error: existingError } = await supabase
      .from('users_meta')
      .select('full_name')
      .in('full_name', fictionalUsers.map(u => u.full_name))

    if (existingError) throw existingError

    const existingNames = new Set(existingUsers?.map(u => u.full_name) || [])
    const usersToCreate = fictionalUsers.filter(u => !existingNames.has(u.full_name))

    if (usersToCreate.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'All fictional users already exist' })
      }
    }

    // Create users
    for (const user of usersToCreate) {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create auth user')

      // 2. Create user meta
      const { error: metaError } = await supabase
        .from('users_meta')
        .insert({
          id: authData.user.id,
          user_id: authData.user.id,
          email: user.email,
          full_name: user.full_name,
          points: user.points,
          avatar_url: user.avatar_url,
          created_at: new Date().toISOString()
        })

      if (metaError) throw metaError
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: `Successfully created ${usersToCreate.length} fictional users` 
      })
    }
  } catch (error) {
    console.error('Error creating fictional users:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      })
    }
  }
} 