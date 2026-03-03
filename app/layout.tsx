'use client'; // Linha 1 obrigatória

import { useState } from 'react';
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { 
  Home, 
  FolderOpen, 
  Users, 
  Shield, 
  FileText, 
  LayoutDashboard, 
  ChevronDown, 
  ChevronUp,
  FileBarChart
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Estado para controlar se o menu Gestão Documental está aberto ou fechado
  const [isGestaoOpen, setIsGestaoOpen] = useState(false);

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-slate-50">
          
          {/* MENU LATERAL */}
          <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col shadow-xl z-20">
            <div className="p-6">
              <h1 className="text-xl font-bold text-white tracking-wider">SGI Hospitalar</h1>
              <p className="text-xs text-slate-400 mt-1">Portal de Gestão</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
              <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                <Home size={20} />
                <span className="font-medium">Início</span>
              </Link>

              {/* TÓPICO RECOLHÍVEL: GESTÃO DOCUMENTAL */}
              <div className="space-y-1">
                <button 
                  onClick={() => setIsGestaoOpen(!isGestaoOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen size={20} className={isGestaoOpen ? "text-amber-500" : ""} />
                    <span className="font-medium">Gestão Documental</span>
                  </div>
                  {isGestaoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Submenu que abre e fecha */}
                {isGestaoOpen && (
                  <div className="pl-4 space-y-1 border-l-2 border-slate-800 ml-5 animate-in slide-in-from-top-1 duration-200">
                    <Link 
                      href="/documentos" 
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm"
                    >
                      <FileText size={16} />
                      <span>Base de Documentos</span>
                    </Link>

                    <Link 
                      href="/painel-bi" 
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm"
                    >
                      <LayoutDashboard size={16} />
                      <span>Painel BI</span>
                    </Link>
                  </div>
                )}
              </div>

              <div className="pt-6 pb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3">Configurações</p>
              </div>
              
              <Link href="/usuarios" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                <Users size={20} />
                <span className="font-medium">Usuários</span>
              </Link>
            </nav>

            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">A</div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">Anderson</span>
                  <span className="text-xs text-slate-400">Administrador</span>
                </div>
              </div>
            </div>
          </aside>

          {/* CONTEÚDO PRINCIPAL */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}