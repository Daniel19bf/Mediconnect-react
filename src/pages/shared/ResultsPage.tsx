import { useQuery } from '@tanstack/react-query';
import { FlaskConical, Upload, FileText, Image, Download, Eye } from 'lucide-react';
import { medicalService } from '../../services/medical.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatFileSize } from '../../lib/utils';
import type { MedicalFile, FileCategory } from '../../types';
import { cn } from '../../lib/utils';
import { useState } from 'react';

const CATEGORY_LABELS: Record<FileCategory, string> = { exam: 'Examen', lab: 'Laboratorio', image: 'Imagen diagnóstica', prescription: 'Fórmula', other: 'Otro' };
const CATEGORY_COLORS: Record<FileCategory, string> = { exam: 'info', lab: 'success', image: 'purple', prescription: 'warning', other: 'default' };
const CATEGORY_ICON: Record<FileCategory, React.ElementType> = { exam: FileText, lab: FlaskConical, image: Image, prescription: FileText, other: FileText };

export default function ResultsPage() {
  const [filter, setFilter] = useState<FileCategory | 'all'>('all');
  const patientId = 'placeholder';

  const { data: files, isLoading } = useQuery({
    queryKey: ['medical-files', patientId],
    queryFn: () => medicalService.getFiles(patientId),
  });

  const filtered = filter === 'all' ? (files ?? []) : (files ?? []).filter(f => f.category === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resultados médicos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{files?.length ?? 0} archivos</p>
        </div>
        <Button icon={<Upload className="w-4 h-4" />}>Subir archivo</Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all','exam','lab','image','prescription','other'] as const).map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all', filter === cat ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700')}>
            {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat as FileCategory]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length:6}).map((_,i) => <div key={i} className="h-36 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <FlaskConical className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">No hay archivos para mostrar</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(f => {
            const Icon = CATEGORY_ICON[f.category];
            return (
              <Card key={f.id} hover className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{f.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(f.created_at)} · {formatFileSize(f.file_size)}</p>
                  </div>
                </div>
                <Badge variant={CATEGORY_COLORS[f.category] as 'info'|'success'|'purple'|'warning'|'default'} className="mb-3">
                  {CATEGORY_LABELS[f.category]}
                </Badge>
                {f.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{f.description}</p>}
                <div className="flex gap-2">
                  <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />} className="w-full">Ver</Button>
                  </a>
                  <a href={f.file_url} download={f.name}>
                    <Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />} />
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
