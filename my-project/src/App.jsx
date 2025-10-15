import { useState } from 'react'
import './App.css'
import GameBoard from './GameBoard'

function App() {
  const [count, setCount] = useState(0)
  return (
    <>
      <GameBoard/>
    </>
  )
}

export default App
