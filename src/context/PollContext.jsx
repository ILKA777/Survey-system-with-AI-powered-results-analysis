import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getUser, signout as apiSignout } from '../api/auth.js'
import * as pollsApi from '../api/polls.js'

const PollContext = createContext()

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl1', name: 'Ретроспектива спринта', type: 'SURVEY',
    pages: [
      { pageOrder: 1, question: 'Что прошло хорошо?', questionType: 'TEXT', options: [], required: false },
      { pageOrder: 2, question: 'Что можно улучшить?', questionType: 'TEXT', options: [], required: false },
      { pageOrder: 3, question: 'Оцените спринт', questionType: 'SINGLE_CHOICE', options: ['⭐ 1', '⭐ 2', '⭐ 3', '⭐ 4', '⭐ 5'], required: true },
    ],
  },
  {
    id: 'tpl2', name: 'Пульс-чек команды', type: 'SURVEY',
    pages: [
      { pageOrder: 1, question: 'Как вы себя чувствуете?', questionType: 'SINGLE_CHOICE', options: ['Отлично', 'Хорошо', 'Нормально', 'Устал'], required: true },
      { pageOrder: 2, question: 'Есть ли блокеры?', questionType: 'TEXT', options: [], required: false },
    ],
  },
  {
    id: 'tpl3', name: 'Обратная связь по мероприятию', type: 'SURVEY',
    pages: [
      { pageOrder: 1, question: 'Как прошло мероприятие?', questionType: 'SINGLE_CHOICE', options: ['Потрясающе', 'Хорошо', 'Средне', 'Плохо'], required: true },
      { pageOrder: 2, question: 'Что понравилось больше всего?', questionType: 'TEXT', options: [], required: false },
      { pageOrder: 3, question: 'Предложения на будущее?', questionType: 'TEXT', options: [], required: false },
    ],
  },
]

export function PollProvider({ children }) {
  const [user, setUserState] = useState(() => getUser())
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const templates = DEFAULT_TEMPLATES

  const loadPolls = useCallback(async () => {
    if (!user) { setPolls([]); return }
    setLoading(true)
    try {
      const data = await pollsApi.listPolls()
      setPolls(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadPolls() }, [loadPolls])

  const setUser = (u) => setUserState(u)

  const signout = () => {
    apiSignout()
    setUserState(null)
    setPolls([])
  }

  const addPoll = async (data) => {
    const poll = await pollsApi.createPoll(data)
    setPolls(prev => [poll, ...prev])
    return poll
  }

  const publish = async (id) => {
    const poll = await pollsApi.publishPoll(id)
    setPolls(prev => prev.map(p => String(p.id) === String(id) ? poll : p))
    return poll
  }

  const getPoll = (id) => polls.find(p => String(p.id) === String(id)) ?? null

  const useTemplate = async (template) => {
    const poll = await addPoll({
      type: template.type,
      title: template.name,
      pages: template.pages,
    })
    return poll
  }

  return (
    <PollContext.Provider value={{
      user, setUser, signout,
      polls, loading, error, loadPolls,
      templates,
      addPoll, publish, getPoll, useTemplate,
    }}>
      {children}
    </PollContext.Provider>
  )
}

export const usePoll = () => useContext(PollContext)
