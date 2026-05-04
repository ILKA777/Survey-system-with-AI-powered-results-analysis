import { createContext, useContext, useState, useEffect } from 'react'

const PollContext = createContext()

const встроенныеШаблоны = [
  {
    id: 'tpl1',
    name: 'Ретроспектива спринта',
    type: 'survey',
    steps: [
      { question: 'Что прошло хорошо в этом спринте?', type: 'open', options: [] },
      { question: 'Что можно улучшить?', type: 'open', options: [] },
      { question: 'Оцените спринт в целом', type: 'closed', options: ['⭐1', '⭐2', '⭐3', '⭐4', '⭐5'] },
    ],
  },
  {
    id: 'tpl2',
    name: 'Пульс-чек команды',
    type: 'survey',
    steps: [
      { question: 'Как вы себя чувствуете сегодня?', type: 'closed', options: ['😊 Отлично', '🙂 Хорошо', '😐 Нормально', '😟 Устал'] },
      { question: 'Есть ли блокеры?', type: 'open', options: [] },
    ],
  },
  {
    id: 'tpl3',
    name: 'Обратная связь по мероприятию',
    type: 'survey',
    steps: [
      { question: 'Как прошло мероприятие?', type: 'closed', options: ['Потрясающе', 'Хорошо', 'Средне', 'Плохо'] },
      { question: 'Что понравилось больше всего?', type: 'open', options: [] },
      { question: 'Предложения на будущее?', type: 'open', options: [] },
    ],
  },
]

export function PollProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pulseroom_user')
    return saved ? JSON.parse(saved) : null
  })

  const [polls, setPolls] = useState(() => {
    const saved = localStorage.getItem('pulseroom_polls')
    return saved ? JSON.parse(saved) : []
  })

  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('pulseroom_templates')
    return saved ? JSON.parse(saved) : встроенныеШаблоны
  })

  useEffect(() => {
    localStorage.setItem('pulseroom_polls', JSON.stringify(polls))
  }, [polls])

  useEffect(() => {
    localStorage.setItem('pulseroom_templates', JSON.stringify(templates))
  }, [templates])

  useEffect(() => {
    if (user) {
      localStorage.setItem('pulseroom_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('pulseroom_user')
    }
  }, [user])

  const addPoll = (poll) => {
    const newPoll = { ...poll, id: Date.now().toString(), createdAt: new Date().toISOString() }
    setPolls(prev => [newPoll, ...prev])
    return newPoll
  }

  const addVote = (data) => {
    const vote = { ...data, id: Date.now().toString(), type: 'vote', createdAt: new Date().toISOString() }
    setPolls(prev => [vote, ...prev])
    return vote
  }

  const updatePoll = (id, data) => {
    setPolls(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
  }

  const duplicatePoll = (id) => {
    const poll = polls.find(p => p.id === id)
    if (!poll) return
    const copy = {
      ...JSON.parse(JSON.stringify(poll)),
      id: Date.now().toString(),
      title: poll.title ? `${poll.title} (Копия)` : undefined,
      question: poll.question ? `${poll.question} (Копия)` : undefined,
      createdAt: new Date().toISOString(),
      votes: poll.type === 'vote' ? {} : poll.votes,
      responses: poll.type === 'survey' ? [] : poll.responses,
    }
    setPolls(prev => [copy, ...prev])
  }

  const deletePoll = (id) => {
    setPolls(prev => prev.filter(p => p.id !== id))
  }

  const getPoll = (id) => {
    if (!id) return null
    return polls.find(p => p.id === id)
  }

  const saveAsTemplate = (pollId, name) => {
    const poll = polls.find(p => p.id === pollId)
    if (!poll || poll.type !== 'survey') return
    const template = {
      id: `tpl_${Date.now()}`,
      name: name || poll.title || 'Без названия',
      type: 'survey',
      steps: JSON.parse(JSON.stringify(poll.steps)),
    }
    setTemplates(prev => [template, ...prev])
  }

  const deleteTemplate = (id) => {
    setTemplates(prev => prev.filter(t => t.id === id))
  }

  const useTemplate = (template) => {
    const newPoll = {
      id: Date.now().toString(),
      type: 'survey',
      title: template.name,
      steps: JSON.parse(JSON.stringify(template.steps)),
      responses: [],
      createdAt: new Date().toISOString(),
    }
    setPolls(prev => [newPoll, ...prev])
    return newPoll
  }

  return (
    <PollContext.Provider value={{
      user,
      setUser,
      polls,
      templates,
      addPoll,
      addVote,
      updatePoll,
      duplicatePoll,
      deletePoll,
      getPoll,
      saveAsTemplate,
      deleteTemplate,
      useTemplate,
    }}>
      {children}
    </PollContext.Provider>
  )
}

export const usePoll = () => useContext(PollContext)