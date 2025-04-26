'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestConnectionPage() {
  const [message, setMessage] = useState('Testing connection...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testConnection() {
      try {
        console.log('Testing connection...')
        const { data, error } = await supabase.from('_prisma_migrations').select('*').limit(1)
        
        if (error) {
          setError(`Error: ${error.message}`)
          setMessage('Connection failed')
        } else {
          setMessage('Successfully connected to Supabase!')
          console.log('Data:', data)
        }
      } catch (err) {
        console.error('Error:', err)
        setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
        setMessage('Connection failed')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4 text-black">Supabase Connection Test</h1>
          <p className={`text-${error ? 'red' : 'gray'}-700 mb-4`}>{message}</p>
          {error && (
            <div className="bg-red-50 p-4 rounded">
              <pre className="text-red-700">{error}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 