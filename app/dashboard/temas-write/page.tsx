// app/dashboard/temas-write/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Loader2, Edit, Trash2 } from 'lucide-react'

type Theme = {
  id: string
  title: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: string
}

export default function ListWriteThemesPage() {
  const supabase = createClient()
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchThemes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('write_themes')
      .select('id, title, category, difficulty, created_at')
      .order('created_at', { ascending: false })
    
    if (data) setThemes(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchThemes()
  }, [])

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja deletar este tema? Esta ação não pode ser desfeita.")) {
      const { error } = await supabase.from('write_themes').delete().eq('id', id)
      if (error) {
        alert(error.message)
      } else {
        fetchThemes() // Re-fetch na lista
      }
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciador de Temas (Write)</h1>
        <Link 
          href="/dashboard/temas-write/new"
          className="flex items-center gap-2 px-4 py-2 bg-myblue text-white rounded-lg hover:bg-opacity-80"
        >
          <Plus className="h-5 w-5" />
          Novo Tema
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border dark:border-gray-700">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-myblue" />
          </div>
        ) : (
          <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Dificuldade</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {themes.map(theme => (
                <tr key={theme.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">{theme.title}</div>
                    <div className="text-xs text-gray-500">Criado em: {new Date(theme.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-600">{theme.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      'px-2 py-1 text-xs rounded-full capitalize',
                      theme.difficulty === 'easy' && 'bg-mygreen/10 text-mygreen',
                      theme.difficulty === 'medium' && 'bg-yellow-100 text-yellow-700',
                      theme.difficulty === 'hard' && 'bg-red-100 text-red-700'
                    )}>
                      {theme.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/dashboard/temas-write/edit/${theme.id}`} className="text-myblue hover:text-myblue/80 mr-4">
                      <Edit className="h-5 w-5 inline-block" />
                    </Link>
                    <button onClick={() => handleDelete(theme.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="h-5 w-5 inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}