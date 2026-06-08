import { Routes, Route, Navigate } from 'react-router-dom'
import { usePoll } from './context/PollContext'
import { FEATURES } from './config/features'
import Dashboard from './pages/Dashboard'
import CreatePoll from './pages/CreatePoll'
import CreateVote from './pages/CreateVote'
import CreateQuiz from './pages/CreateQuiz'
import PollDetail from './pages/PollDetail'
import Join from './pages/Join'
import Thanks from './pages/Thanks'
import Analytics from './pages/Analytics'
import Login from './pages/Login'
import Welcome from './pages/Welcome'
import Layout from './components/Layout'

export default function App() {
  const { user } = usePoll()

  return (
    <>
      {!user ? (
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/join/:roomCode" element={<Join />} />
          <Route path="/thanks" element={<Thanks />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create/poll" element={<CreatePoll />} />
            <Route path="/create/vote" element={<CreateVote />} />
            {FEATURES.quiz && <Route path="/create/quiz" element={<CreateQuiz />} />}
            <Route path="/poll/:id" element={<PollDetail />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/join/:roomCode" element={<Join />} />
            <Route path="/thanks" element={<Thanks />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </>
  )
}
