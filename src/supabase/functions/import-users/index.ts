import { createClient } from '@supabase/supabase-js'

export const handler = async (event: any) => {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) throw authError

    // Get existing users_meta
    const { data: existingMeta, error: metaError } = await supabase
      .from('users_meta')
      .select('user_id')
    if (metaError) throw metaError

    // Create array of existing user_ids
    const existingUserIds = existingMeta?.map(meta => meta.user_id) || []

    // Filter out users that don't exist in users_meta
    const usersToImport = authUsers?.users.filter(
      user => !existingUserIds.includes(user.id)
    ) || []

    // Import new users
    if (usersToImport.length > 0) {
      const { error: insertError } = await supabase
        .from('users_meta')
        .insert(
          usersToImport.map(user => ({
            user_id: user.id,
            email: user.email,
            points: 0,
            created_at: new Date().toISOString()
          }))
        )
      if (insertError) throw insertError
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Users imported successfully' })
    }
  } catch (error) {
    console.error('Error importing users:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      })
    }
  }
} 