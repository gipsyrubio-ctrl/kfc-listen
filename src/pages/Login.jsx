import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'

export default function Login() {
  const { login }         = useAuth()
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, pass)
    } catch (err) {
      setError('Correo o contraseña incorrectos.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FFF5F0] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-gradient-to-br from-[#1A0A0A] to-[#3D0C0C] p-8 text-center">
          <span className="inline-block bg-[#E4002B] text-white font-black text-sm px-3 py-1 rounded-md mb-3">KFC</span>
          <h1 className="text-white text-xl font-bold mb-1">Listen</h1>
          <p className="text-white/50 text-xs">Dashboard · Gestión Humana</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-[#5C4A44] mb-1 block">Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border-2 border-[#E8DDD9] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E4002B]"
                placeholder="tu@kfc.com.co" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5C4A44] mb-1 block">Contraseña</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} required
                className="w-full border-2 border-[#E8DDD9] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E4002B]"
                placeholder="••••••••" />
            </div>
            {error && <p className="text-xs text-[#E4002B] bg-[#FEF2F2] px-3 py-2 rounded-xl">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#E4002B] text-white font-bold rounded-xl mt-1 hover:bg-[#C8002A] disabled:bg-[#E8DDD9] disabled:cursor-not-allowed">
              {loading ? 'Ingresando…' : 'Ingresar al dashboard →'}
            </button>
          </form>
          <p className="text-center text-xs text-[#9C8680] mt-4">
            ¿Problemas para ingresar? Contacta al equipo de GH.
          </p>
        </div>
      </div>
    </div>
  )
}
