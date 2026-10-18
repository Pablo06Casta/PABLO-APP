import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="PABLO APP, inicio">
          <span className="brand-mark" aria-hidden="true">p.</span>
          <span>PABLO APP</span>
        </a>
        <a className="nav-link" href="#demo">
          Probar la app <span aria-hidden="true"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12 12 4M4 4h8v8" /></svg></span>
        </a>
      </header>

      <main id="inicio">
        <section className="hero" aria-labelledby="welcome-title">
          <p className="eyebrow"><span aria-hidden="true" /> PRIMERA VERSIÓN</p>
          <h1 id="welcome-title">Tu idea<br />empieza <em>aquí.</em></h1>
          <p className="hero-description">
            Un espacio para crear, probar y dar forma a lo que viene.
            Este es el primer paso de PABLO APP.
          </p>
          <a className="primary-link" href="#demo">Explorar la demo <span aria-hidden="true">↓</span></a>
        </section>

        <section className="demo" id="demo" aria-labelledby="demo-title">
          <div className="demo-copy">
            <span className="section-number" aria-hidden="true">01 / DEMO</span>
            <h2 id="demo-title">Todo empieza<br />con un clic.</h2>
            <p>Prueba algo sencillo: suma, vuelve a empezar y sigue explorando.</p>
          </div>
          <div className="counter-card">
            <span className="counter-label">UN PASO CADA VEZ</span>
            <output className="counter-value" aria-label="Contador" aria-live="polite">{count}</output>
            <div className="counter-actions">
              <button className="add-button" onClick={() => setCount((value) => value + 1)}>
                <span aria-hidden="true">＋</span> Sumar uno
              </button>
              <button className="reset-button" onClick={() => setCount(0)} disabled={count === 0}>
                Reiniciar
              </button>
            </div>
            <p className="counter-note">Cada gran idea tiene un pequeño comienzo.</p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>PABLO APP</span>
        <span>Hecha para lo que viene.</span>
      </footer>
    </div>
  )
}

export default App
