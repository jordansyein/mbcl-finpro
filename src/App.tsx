import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CaptureDraftProvider } from './context/CaptureDraftContext'
import ProtectedRoute from './components/ProtectedRoute'
import NavBar from './components/NavBar'
import LoginPage from './pages/LoginPage'
import CapturePage from './pages/CapturePage'
import ConfirmPage from './pages/ConfirmPage'
import PracticePage from './pages/PracticePage'
import WeakPointsPage from './pages/WeakPointsPage'
import BriefingPage from './pages/BriefingPage'
import HistoryPage from './pages/HistoryPage'
import LessonDetailPage from './pages/LessonDetailPage'
import ProfilePage from './pages/ProfilePage'

function Shell({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const location = useLocation()
  const showNav = !!session && location.pathname !== '/login'
  return (
    <div className="app-shell">
      <div className="app-content">{children}</div>
      {showNav && <NavBar />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CaptureDraftProvider>
        <BrowserRouter>
          <Shell>
            <Routes>
              <Route path="/" element={<Navigate to="/capture" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/capture" element={<ProtectedRoute><CapturePage /></ProtectedRoute>} />
              <Route path="/confirm" element={<ProtectedRoute><ConfirmPage /></ProtectedRoute>} />
              <Route path="/practice" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
              <Route path="/weak-points" element={<ProtectedRoute><WeakPointsPage /></ProtectedRoute>} />
              <Route path="/briefing" element={<ProtectedRoute><BriefingPage /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
              <Route path="/history/:lessonId" element={<ProtectedRoute><LessonDetailPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/capture" replace />} />
            </Routes>
          </Shell>
        </BrowserRouter>
      </CaptureDraftProvider>
    </AuthProvider>
  )
}
