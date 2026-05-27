import { useQuery } from '@tanstack/react-query';
import { Pill, Download, Plus, Calendar, User } from 'lucide-react';
import { medicalService } from '../../services/medical.service';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { formatDate } from '../../lib/utils';
import type { Prescription } from '../../types';

export default function PrescriptionsPage() {
  const { profile } = useAuthStore();

  // In a real app, get the patient ID from the profile
  const patientId = 'placeholder';

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['prescriptions', patientId],
    queryFn: () => medicalService.getPatientPrescriptions(patientId),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recetas médicas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{prescriptions?.length ?? 0} recetas</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({length:3}).map((_,i) => <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : !prescriptions?.length ? (
        <Card className="p-12 text-center">
          <Pill className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">No hay recetas médicas</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {prescriptions.map(rx => (
            <Card key={rx.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Receta Médica</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(rx.issued_at)}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />Dr. {rx.doctor?.profile?.full_name ?? '—'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rx.valid_until && (
                    <Badge variant={new Date(rx.valid_until) > new Date() ? 'success' : 'danger'}>
                      {new Date(rx.valid_until) > new Date() ? 'Vigente' : 'Vencida'}
                    </Badge>
                  )}
                  <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>PDF</Button>
                </div>
              </div>

              {/* Medications */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Medicamentos</p>
                <div className="space-y-3">
                  {(rx.medications ?? []).map((med, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{i+1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{med.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{med.dose} · {med.frequency} · {med.duration}</p>
                        {med.instructions && <p className="text-xs text-gray-400 italic mt-0.5">{med.instructions}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {rx.indications && (
                <div className="mt-3 p-3 border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Indicaciones</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">{rx.indications}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
