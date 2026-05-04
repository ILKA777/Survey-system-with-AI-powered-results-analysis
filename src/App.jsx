import { Routes, Route, Navigate } from 'react-router-dom'
import { usePoll } from './context/PollContext'
import Dashboard from './pages/Dashboard'
import CreatePoll from './pages/CreatePoll'
import CreateVote from './pages/CreateVote'
import TakePoll from './pages/TakePoll'
import TakeVote from './pages/TakeVote'
import Results from './pages/Results'
import Templates from './pages/Templates'
import Analytics from './pages/Analytics'
import Login from './pages/Login'
import Welcome from './pages/Welcome'
import Layout from './components/Layout'

export default function App() {
  const { user } = usePoll()

  // Все маршруты в одном блоке, чтобы опросы были доступны всем
  return (
    <>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Welcome />} />
          <Route path="/poll/:id" element={<TakePoll />} />
          <Route path="/vote/:id" element={<TakeVote />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create/poll" element={<CreatePoll />} />
            <Route path="/create/vote" element={<CreateVote />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/poll/:id" element={<TakePoll />} />
            <Route path="/vote/:id" element={<TakeVote />} />
            <Route path="/results/:id" element={<Results />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </>
  )
}