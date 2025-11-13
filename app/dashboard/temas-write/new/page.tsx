// app/dashboard/temas-write/new/page.tsx
import ThemeForm from '../temas-write/ThemeForm'
import { BookOpen } from 'lucide-react'

export default function NewThemePage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-8 w-8 text-myblue" />
        <h1 className="text-3xl font-bold">Criar Novo Tema</h1>
      </div>
      
      <ThemeForm isEditing={false} />
    </div>
  )
}