import { useState } from 'react'
import { useStore } from './store/useStore'
import TabBar, { type Tab } from './components/TabBar'
import HomeScreen from './screens/HomeScreen'
import ProjectsScreen from './screens/ProjectsScreen'
import RecordsScreen from './screens/RecordsScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import FocusScreen from './screens/FocusScreen'

export default function App() {
  const northStar = useStore((s) => s.northStar)
  const [tab, setTab] = useState<Tab>('journey')
  const [focus, setFocus] = useState(false)
  const [justFinished, setJustFinished] = useState(false)

  if (!northStar) {
    return (
      <div className="app dark">
        <OnboardingScreen />
      </div>
    )
  }

  if (focus) {
    return (
      <div className="app dark">
        <FocusScreen
          onExit={() => {
            setFocus(false)
            setJustFinished(true)
            setTab('journey')
            setTimeout(() => setJustFinished(false), 2200)
          }}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {tab === 'journey' && <HomeScreen onStart={() => setFocus(true)} justFinished={justFinished} />}
        {tab === 'projects' && <ProjectsScreen />}
        {tab === 'records' && <RecordsScreen />}
      </div>
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
