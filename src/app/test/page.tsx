'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

export default function TestPage() {
  const [message, setMessage] = useState('Testing connection...')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('_prisma_migrations').select('*').limit(1)
        
        if (error) {
          setMessage(`Error: ${error.message}`)
        } else {
          setMessage('Successfully connected to Supabase!')
          setData(data)
        }
      } catch (error) {
        setMessage(`Error: ${error}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4 text-black">Supabase Connection Test</h1>
          <p className="text-gray-700 mb-4">{message}</p>
          {data && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2 text-black">Data:</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 