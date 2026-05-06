import { supabase } from './supabase.js'

export async function submitResponse(pollId, answers, nickname = null) {
  const { data, error } = await supabase
    .from('responses')
    .insert({ poll_id: pollId, answers, participant_nickname: nickname })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
