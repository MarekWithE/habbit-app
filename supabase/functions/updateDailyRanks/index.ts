// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

console.log("🔄 Starting daily rank update...")

Deno.serve(async () => {
  try {
    // Fetch all users
    const { data: users, error: userErr } = await supabase
      .from('users_meta')
      .select('user_id, total_pts, streak, last_date')

    if (userErr) throw new Error('User fetch error: ' + userErr.message)
    if (!users || users.length === 0) {
      console.log('ℹ️ No users found to process')
      return new Response('No users found to process', { status: 200 })
    }

    console.log(`📊 Processing ${users.length} users...`)
    const today = new Date().toISOString().split('T')[0]

    for (const user of users) {
      const { user_id, total_pts, streak, last_date } = user
      console.log(`👤 Processing user ${user_id}...`)

      if (last_date === today) {
        console.log(`⏭️ User ${user_id} already processed today, skipping...`)
        continue
      }

      // Fetch user's habits for today
      const { data: habits, error: habitErr } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user_id)
        .eq('date', today)

      if (habitErr) throw new Error('Habit fetch error: ' + habitErr.message)

      const completed = habits?.length || 0
      let points = completed * 4
      if (completed === 5) points += 10

      console.log(`📝 User ${user_id} completed ${completed} habits, earning ${points} points`)

      let newTotal = total_pts
      let newStreak = 0

      if (completed === 0) {
        const penalty = Math.min(20, (streak + 1) * 5)
        newTotal = Math.max(0, total_pts - penalty)
        newStreak = streak + 1
        console.log(`⚠️ User ${user_id} missed a day, applying penalty of ${penalty} points`)
      } else {
        newTotal += points
        newStreak = 0
      }

      // Insert progress record
      const { error: insertErr } = await supabase.from('progress').insert({
        user_id,
        date: today,
        completed,
        points: completed === 0 ? 0 : points
      })

      if (insertErr) throw new Error('Insert progress error: ' + insertErr.message)
      console.log(`✅ Progress record inserted for user ${user_id}`)

      // Update user meta
      const { error: updateErr } = await supabase.from('users_meta').update({
        total_pts: newTotal,
        streak: newStreak,
        last_date: today
      }).eq('user_id', user_id)

      if (updateErr) throw new Error('Meta update error: ' + updateErr.message)
      console.log(`✅ User ${user_id} meta updated: total_pts=${newTotal}, streak=${newStreak}`)
    }

    console.log('✨ Daily rank update completed successfully!')
    return new Response('Daily rank update complete!', { status: 200 })
  } catch (e: any) {
    console.error('🔥 ERROR:', e)
    return new Response(`Error: ${e.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/updateDailyRanks' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
