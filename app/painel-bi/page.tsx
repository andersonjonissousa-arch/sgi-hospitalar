'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LabelList 
} from 'recharts';
import { LayoutDashboard, Loader2, RotateCcw, Activity } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PainelBIPage() {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selTipo, setSelTipo] = useState('');
  const [selLocal, setSelLocal] = useState('');
  const [selStatus, setSelStatus] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await supabase.from('gestao_documental').select('*');
        setDocumentos(data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const docsFiltrados = useMemo(() => {
    return documentos.filter(doc => {
      return (!selTipo || doc.tipo_documento === selTipo) &&
             (!selLocal || doc.localizacao_documento === selLocal) &&
             (!selStatus || doc.status === selStatus);
    });
  }, [documentos, selTipo, selLocal, selStatus]);

  const options = useMemo(() => ({
    tipos: Array.from(new Set(documentos.map(d => d.tipo_documento))).filter(Boolean).sort(),
    locais: Array.from(new Set(documentos.map(d => d.localizacao_documento))).filter(Boolean).sort(),
    status: Array.from(new Set(documentos.map(d => d.status))).filter(Boolean).sort(),
  }), [documentos]);

  const stats = useMemo(() => {
    const porSetor: Record<string, number> = {};
    const porTipo: Record<string, number> = {};
    const porStatus: Record<string, number> = {};
    let vencidos = 0, emDia = 0;
    const hoje = new Date();

    docsFiltrados.forEach((doc) => {
      porSetor[doc.localizacao_documento || 'N/I'] = (porSetor[doc.localizacao_documento || 'N/I'] || 0) + 1;
      porTipo[doc.tipo_documento || 'N/I'] = (porTipo[doc.tipo_documento || 'N/I'] || 0) + 1;
      porStatus[doc.status || 'N/I'] = (porStatus[doc.status || 'N/I'] || 0) + 1;

      if (doc.proxima_revisao) {
        new Date(doc.proxima_revisao) < hoje ? vencidos++ : emDia++;
      }
    });

    return {
      setor: Object.keys(porSetor).map(k => ({ name: k, value: porSetor[k] })),
      tipo: Object.keys(porTipo).map(k => ({ name: k, value: porTipo[k] })),
      status: Object.keys(porStatus).map(k => ({ name: k, value: porStatus[k] })),
      vencimento: [
        { name: 'Vencido', value: vencidos, fill: '#ef4444' },
        { name: 'Em dia', value: emDia, fill: '#10b981' }
      ]
    };
  }, [docsFiltrados]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-500">
      <Loader2 className="animate-spin mr-2" /> Atualizando Dashboard...
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-6">
      {/* Filtros */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <LayoutDashboard className="text-blue-600" /> BI - Visão Geral
            </h1>
            <p className="text-slate-500 text-sm">Documentos Analisados: {docsFiltrados.length}</p>
          </div>
          <button onClick={() => {setSelTipo(''); setSelLocal(''); setSelStatus('');}} className="flex items-center gap-2 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-full transition-colors">
            <RotateCcw size={14} /> Resetar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={selTipo} onChange={e => setSelTipo(e.target.value)} className="p-2.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os Tipos</option>
            {options.tipos.map(t => <option key={t} value={t as string}>{t as string}</option>)}
          </select>
          <select value={selLocal} onChange={e => setSelLocal(e.target.value)} className="p-2.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todas as Localizações</option>
            {options.locais.map(l => <option key={l} value={l as string}>{l as string}</option>)}
          </select>
          <select value={selStatus} onChange={e => setSelStatus(e.target.value)} className="p-2.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os Status</option>
            {options.status.map(s => <option key={s} value={s as string}>{s as string}</option>)}
          </select>
        </div>
      </div>

      {/* Grid de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Vencimento */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[380px]">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">📊 Prazo de Validade</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.vencimento} innerRadius={60} outerRadius={80} dataKey="value" label={({name, value}) => `${name}: ${value}`}>
                {stats.vencimento.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Status (NOVO GRÁFICO) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[380px]">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Activity size={18} className="text-amber-500"/> Volume por Status</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.status} onClick={(data) => data && setSelStatus(String(data.activeLabel || ''))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="value" position="top" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Tipo */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[380px]">
          <h3 className="font-bold text-slate-700 mb-4">Volume por Tipo</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.tipo} onClick={(data) => data && setSelTipo(String(data.activeLabel || ''))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="value" position="top" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Setor */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[380px]">
          <h3 className="font-bold text-slate-700 mb-4">Volume por Setor</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.setor} onClick={(data) => data && setSelLocal(String(data.activeLabel || ''))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="value" position="top" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}