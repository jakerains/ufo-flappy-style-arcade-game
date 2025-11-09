import React from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { GameShell } from './components/game/GameShell'

const App: React.FC = () => {
  return (
    <AppLayout>
      <GameShell />
    </AppLayout>
  )
}

export default App
