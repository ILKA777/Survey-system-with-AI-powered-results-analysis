import { supabase } from './supabase.js'

const USER_KEY = 'pulseroom_user'

export async function signup(nickname) {
  const { data, error } = await supabase
    .from('users')
    .upsert({ nickname }, { onConflict: 'nickname' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  localStorage.setItem(USER_KEY, JSON.stringify(data))
  return data
}

export async function signin(nickname) {
  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('nickname', nickname)
    .single()
  if (error) throw new Error('Пользователь не найден')
  localStorage.setItem(USER_KEY, JSON.stringify(data))
  return data
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function signout() {
  localStorage.removeItem(USER_KEY)
}
