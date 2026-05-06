import { supabase } from './supabase.js'
import { getUser } from './auth.js'

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

export async function listPolls() {
  const user = getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function getPoll(id) {
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getPollByRoomCode(roomCode) {
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('room_code', roomCode.toUpperCase())
    .eq('status', 'PUBLISHED')
    .single()
  if (error) throw new Error('Опрос не найден или не опубликован')
  return data
}

export async function createPoll(pollData) {
  const user = getUser()
  if (!user) throw new Error('Необходима авторизация')
  const { data, error } = await supabase
    .from('polls')
    .insert({
      type: pollData.type,
      title: pollData.title,
      pages: pollData.pages,
      owner_id: user.id,
      room_code: generateRoomCode(),
      status: 'DRAFT',
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function publishPoll(id) {
  const { data, error } = await supabase
    .from('polls')
    .update({ status: 'PUBLISHED' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function closePoll(id) {
  const { data, error } = await supabase
    .from('polls')
    .update({ status: 'CLOSED' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deletePoll(id) {
  const { error } = await supabase.from('polls').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function duplicatePoll(id) {
  const poll = await getPoll(id)
  return createPoll({
    type: poll.type,
    title: `${poll.title} (Копия)`,
    pages: poll.pages,
  })
}
