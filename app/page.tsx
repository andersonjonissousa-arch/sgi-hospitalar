import { LayoutDashboard } from "lucide-react";

export default function HomePage() {
  return (
    <div className="p-6 md:p-10">
      <div className="mb-8 flex items-center gap-3">
        <LayoutDashboard className="text-blue-600 w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard Geral</h1>
          <p className="text-slate-500 mt-1">Bem-vindo ao novo SGI Hospitalar</p>
        </div>
      </div>

      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Sistema em Construção 🚀</h2>
        <p className="text-slate-500 max-w-lg">
          O seu sistema foi migrado para uma arquitetura moderna. 
          Utilize o menu lateral escuro para navegar instantaneamente entre os módulos sem recarregar a página.
        </p>
      </div>
    </div>
  );
}