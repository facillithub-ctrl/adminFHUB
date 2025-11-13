// app/dashboard/temas-write/edit/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ThemeForm, { type Theme } from '../ThemeForm'
import { Loader2, Edit } from 'lucide-react'

export default function EditThemePage() {
  const params = useParams()
  const { id } = params
  const supabase = createClient()
  const [theme, setTheme] = useState<Theme | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    
    const fetchTheme = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('write_themes')
        .select('*')
        .eq('id', id)
        .single()
        
      if (data) {
        setTheme(data as Theme)
      } else {
        console.error(error)
      }
      setLoading(false)
    }
    
    fetchTheme()
  }, [id, supabase])

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Edit className="h-8 w-8 text-myblue" />
        <h1 className="text-3xl font-bold">Editar Tema</h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-myblue" />
        </div>
      ) : theme ? (
        <ThemeForm isEditing={true} theme={theme} />
      ) : (
        <p>Tema não encontrado.</p>
      )}
    </div>
  )
}