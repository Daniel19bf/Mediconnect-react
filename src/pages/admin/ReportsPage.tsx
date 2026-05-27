import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Download, FileText, Users, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MOCK_REVENUE = MONTHS.map((m, i) => ({ month: m, consultations: Math.floor(80 + Math.random()*80), revenue: Math.floor(4000000 + Math.random()*3000000) }));
const MOCK_APPTS   = MONTHS.map((m, i) => ({ month: m, scheduled: Math.floor(40+Math.random()*60), completed: Math.floor(30+Math.random()*50), cancelled: Math.floor(5+Math.random()*10) }));

export default function ReportsPage() {
  const [period, setPeriod] = useState<'month'|'quarter'|'year'>('month');

  const exportCSV = (data: Record<string, unknown>[], filename: string) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename + '.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Estadísticas y análisis del sistema</p>
        </div>
        <div className="flex gap-2">
          {(['month','quarter','year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${period === p ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              {{ month: 'Mes', quarter: 'Trimestre', year: 'Año' }[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Quick export cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Reporte de pacientes', icon: Users, action: () => exportCSV([{id:1,name:'Test'}], 'pacientes') },
          { label: 'Reporte de citas', icon: Calendar, action: () => exportCSV(MOCK_APPTS, 'citas') },
          { label: 'Reporte de ingresos', icon: TrendingUp, action: () => exportCSV(MOCK_REVENUE, 'ingresos') },
          { label: 'Reporte general', icon: FileText, action: () => exportCSV(MOCK_REVENUE, 'general') },
        ].map(r => (
          <Card key={r.label} className="p-5">
            <r.icon className="w-8 h-8 text-primary-500 mb-3" />
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">{r.label}</p>
            <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={r.action} className="w-full">
              Exportar CSV
            </Button>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Ingresos por mes</h3>
          <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => exportCSV(MOCK_REVENUE, 'ingresos-mensuales')}>
            Exportar
          </Button>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={MOCK_REVENUE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#1a56db" radius={[4,4,0,0]} name="Ingresos" />
              <Bar dataKey="consultations" fill="#0694a2" radius={[4,4,0,0]} name="Consultas" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Appointments trend */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900 dark:text-white">Tendencia de citas</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={MOCK_APPTS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="scheduled" stroke="#1a56db" strokeWidth={2} name="Programadas" dot={false} />
              <Line type="monotone" dataKey="completed" stroke="#057a55" strokeWidth={2} name="Completadas" dot={false} />
              <Line type="monotone" dataKey="cancelled" stroke="#e02424" strokeWidth={2} name="Canceladas" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
}
