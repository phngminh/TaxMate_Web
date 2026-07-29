import './App.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './contexts/AuthContext'
import { useEffect } from 'react'
import useRouteElements from './contexts/useRouteElement'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { BusinessProvider } from './contexts/BusinessContext'

function AppRoutes() {
  const routeElement = useRouteElements()
  return <>{routeElement}</>
}

function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: false,
      mirror: true,
      offset: 110,
    })
  }, [])

  return (
    <AuthProvider>
      <BusinessProvider>
        <AppRoutes />
        <ToastContainer />
      </BusinessProvider>
    </AuthProvider>
  )
}

export default App