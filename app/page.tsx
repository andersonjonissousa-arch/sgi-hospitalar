'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function CadastroUsuario() {
  // Estado para guardar os dados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    perfil: 'Usuário',
    setor: '',
    telefone: ''
  })
  const [loading, setLoading] = useState(false)

  // A ponte para a sua planilha da sede
  const GOOGLE_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwhJMeVeTUxHX_X6mJTfgDGrtYvoXbIb2YNDuC7Phlum_tsWfjcCPXp4lY5wNcW5e4/exec'

  async function salvarUsuario() {
    if (!formData.nome || !formData.email) return alert('Nome e E-mail são obrigatórios!')
    
    setLoading(true)

    // 1. Geramos o ID no mesmo padrão do seu sistema antigo
    const idUser = "USR-" + new Date().getTime()
    const novoUsuario = {
      id: idUser,
      nome: formData.nome,
      email: formData.email,
      perfil: formData.perfil,
      setor: formData.setor,
      telefone: formData.telefone,
      status: 'Ativo' // Status padrão
    }

    try {
      // 2. Salva no Supabase (Motor principal e rápido)
      const { error: supabaseError } = await supabase
        .from('sys_usuarios')
        .insert([novoUsuario])

      if (supabaseError) throw new Error('Erro no Supabase: ' + supabaseError.message)

      // 3. Salva no Google Sheets (Espelho para a Sede) via Webhook
      const googleResponse = await fetch(GOOGLE_WEBHOOK_URL, {
        method: 'POST',
        body: JSON.stringify({
          acao: 'NOVO_USUARIO', // A "senha" que o nosso Apps Script está esperando
          ...novoUsuario
        })
      })

      if (!googleResponse.ok) throw new Error('Erro ao espelhar na Planilha.')

      alert('Sucesso! Usuário salvo no novo sistema e espelhado na planilha.')
      setFormData({ nome: '', email: '', perfil: 'Usuário', setor: '', telefone: '' })

    } catch (err: any) {
      alert('Ocorreu um erro: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-10 flex flex-col gap-4 max-w-xl mx-auto bg-slate-50 min-h-screen text-slate-800">
      <h1 className="text-3xl font-bold text-blue-900 mb-4">Novo Usuário - SGI</h1>
      
      <div className="flex flex-col gap-3">
        <label className="font-semibold text-slate-700">Nome Completo</label>
        <input type="text" className="p-2 border rounded shadow-sm" value={formData.nome}
          onChange={(e) => setFormData({...formData, nome: e.target.value})} />
        
        <label className="font-semibold text-slate-700">E-mail</label>
        <input type="email" className="p-2 border rounded shadow-sm" value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})} />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-slate-700">Telefone</label>
            <input type="text" className="p-2 border rounded shadow-sm" value={formData.telefone}
              onChange={(e) => setFormData({...formData, telefone: e.target.value})} />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-slate-700">Perfil</label>
            <select className="p-2 border rounded shadow-sm bg-white" value={formData.perfil}
              onChange={(e) => setFormData({...formData, perfil: e.target.value})}>
              <option value="Usuário">Usuário</option>
              <option value="Gestor">Gestor</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
        </div>

        <label className="font-semibold text-slate-700">Setor</label>
        <input type="text" className="p-2 border rounded shadow-sm" value={formData.setor}
          onChange={(e) => setFormData({...formData, setor: e.target.value})} />
      </div>

      <button onClick={salvarUsuario} disabled={loading}
        className="mt-6 bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-slate-400 transition-all">
        {loading ? 'Sincronizando...' : 'Cadastrar Usuário'}
      </button>
    </main>
  )
}