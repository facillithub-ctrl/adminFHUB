// app/dashboard/temas-write/ThemeForm.tsx
'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Plus, Trash2, Upload, Image as ImageIcon, FileText } from 'lucide-react'
import Alert from '@/components/common/Alert'

// Tipos
type GuidingText = {
  type: 'text' | 'image'
  content?: string
  url?: string
  caption?: string
}

export type Theme = {
  id?: string
  title: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  cover_image_url: string | null
  guiding_texts: GuidingText[]
}

type ThemeFormProps = {
  theme?: Theme | null // Tema existente para edição
  isEditing: boolean
}

export default function ThemeForm({ theme = null, isEditing }: ThemeFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const [formData, setFormData] = useState<Theme>(
    theme || {
      title: '',
      description: '',
      category: 'Atualidades',
      difficulty: 'medium',
      cover_image_url: null,
      guiding_texts: [{ type: 'text', content: '' }],
    }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // --- Gerenciamento da Imagem de Capa ---
  const handleCoverImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImageFile(e.target.files[0])
      const previewUrl = URL.createObjectURL(e.target.files[0])
      setFormData(prev => ({ ...prev, cover_image_url: previewUrl }))
    }
  }

  // --- Gerenciamento Dinâmico dos Textos Motivadores ---
  const handleGuidingTextChange = (index: number, field: keyof GuidingText, value: string) => {
    const newTexts = [...formData.guiding_texts]
    // @ts-ignore
    newTexts[index][field] = value
    setFormData(prev => ({ ...prev, guiding_texts: newTexts }))
  }

  const addGuidingText = (type: 'text' | 'image') => {
    const newItem: GuidingText = type === 'text'
      ? { type: 'text', content: '' }
      : { type: 'image', url: '', caption: '' }
    setFormData(prev => ({
      ...prev,
      guiding_texts: [...prev.guiding_texts, newItem]
    }))
  }

  const removeGuidingText = (index: number) => {
    const newTexts = formData.guiding_texts.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, guiding_texts: newTexts }))
  }
  
  // --- SUBMIT DO FORMULÁRIO ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    let finalCoverImageUrl = formData.cover_image_url

    try {
      // 1. Fazer upload da imagem de capa, se uma nova foi selecionada
      if (coverImageFile) {
        const filePath = `theme_covers/${Date.now()}_${coverImageFile.name}`
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('theme_images') // Bucket que criamos (ou você pode usar um público)
          .upload(filePath, coverImageFile, { upsert: true })
          
        if (uploadError) throw uploadError

        const { data: urlData } = supabase
          .storage
          .from('theme_images')
          .getPublicUrl(uploadData.path)
        
        finalCoverImageUrl = urlData.publicUrl
      }

      // 2. Criar ou Atualizar o tema no banco
      const dataToUpsert = {
        ...formData,
        cover_image_url: finalCoverImageUrl,
      }
      
      let query
      if (isEditing && dataToUpsert.id) {
        // Modo de Edição
        query = supabase.from('write_themes').update(dataToUpsert).eq('id', dataToUpsert.id)
      } else {
        // Modo de Criação (remove ID indefinido se houver)
        delete dataToUpsert.id
        query = supabase.from('write_themes').insert(dataToUpsert)
      }
      
      const { error: dbError } = await query
      if (dbError) throw dbError

      // 3. Sucesso
      setLoading(false)
      router.push('/dashboard/temas-write') // Volta para a lista
      router.refresh() // Força a atualização da lista
      
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Ocorreu um erro desconhecido.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Seção 1: Informações Básicas */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Título */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">Título do Tema</label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          {/* Categoria */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">Categoria</label>
            <select
              name="category"
              id="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option>Atualidades</option>
              <option>Filosofia</option>
              <option>Ciência</option>
              <option>Educação</option>
              <option>Social</option>
            </select>
          </div>
          {/* Dificuldade */}
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium mb-1">Dificuldade</label>
            <select
              name="difficulty"
              id="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="easy">Fácil</option>
              <option value="medium">Médio</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
          {/* Descrição */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição Curta (Eixo Temático)</label>
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          {/* Imagem de Capa */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Imagem de Capa</label>
            <input
              type="file"
              id="cover_image_url"
              accept="image/png, image/jpeg"
              onChange={handleCoverImageChange}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-myblue file:text-white hover:file:bg-myblue/80"
            />
            {formData.cover_image_url && (
              <img src={formData.cover_image_url} alt="Preview" className="mt-4 w-1/3 rounded-lg object-cover" />
            )}
          </div>
        </div>
      </div>

      {/* Seção 2: Textos Motivadores */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Textos Motivadores</h2>
        <div className="space-y-6">
          {formData.guiding_texts.map((item, index) => (
            <div key={index} className="p-4 border dark:border-gray-600 rounded-lg relative">
              <button
                type="button"
                onClick={() => removeGuidingText(index)}
                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              
              {item.type === 'text' ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Texto Motivador {index + 1}</label>
                  <textarea
                    value={item.content}
                    onChange={(e) => handleGuidingTextChange(index, 'content', e.target.value)}
                    rows={5}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Cole o texto motivador aqui..."
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Imagem Motivadora {index + 1}</label>
                  <input
                    type="text"
                    value={item.url}
                    onChange={(e) => handleGuidingTextChange(index, 'url', e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="https://... URL da Imagem"
                  />
                  <input
                    type="text"
                    value={item.caption}
                    onChange={(e) => handleGuidingTextChange(index, 'caption', e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Fonte ou legenda da imagem"
                  />
                </div>
              )}
            </div>
          ))}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => addGuidingText('text')}
              className="flex items-center gap-2 text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
            >
              <FileText className="h-4 w-4" /> Adicionar Texto
            </button>
            <button
              type="button"
              onClick={() => addGuidingText('image')}
              className="flex items-center gap-2 text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
            >
              <ImageIcon className="h-4 w-4" /> Adicionar Imagem
            </button>
          </div>
        </div>
      </div>
      
      {/* Seção 3: Modelo/Estrutura */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
         <h2 className="text-xl font-semibold mb-4">Estrutura Modelo (Opcional)</h2>
         <textarea
            name="structure_model"
            value={formData.structure_model || ''}
            onChange={handleChange}
            rows={4}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="Dicas de estrutura para o aluno. Ex: 1. Introdução: Contextualize e apresente a tese..."
          />
      </div>

      <Alert message={error} type="error" onClose={() => setError(null)} />

      {/* Botão de Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-myblue text-white font-semibold rounded-lg hover:bg-opacity-80 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {loading ? (isEditing ? 'Salvando...' : 'Criando...') : (isEditing ? 'Salvar Alterações' : 'Criar Tema')}
        </button>
      </div>
    </form>
  )
}