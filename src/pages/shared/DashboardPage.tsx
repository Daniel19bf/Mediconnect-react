import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, Stethoscope, Calendar, CheckCircle, Video, DollarSign,
  Clock, ArrowRight, Activity,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth.store';
import { dashboardService } from '../../services/dashboard.service';
import { appointmentsService } from '../../services/appointments.service';
import { formatDateTime, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS, formatCurrency } from '../../lib/utils';
import { Link } from 'react-router-dom';

const PIE_COLORS = ['#1a56db','#0694a2','#057a55','#7e3af2','#d97706','#e02424','#ec4899','#06b6d4'];

// ── Mock data for chart demos ──────────────────────────────
const MONTHLY_PATIENTS = [
  { month: 'Ene', count: 120 },{ month: 'Feb', count: 145 },{ month: 'Mar', count: 132 },
  { month: 'Abr', count: 178 },{ month: 'May', count: 156 },{ month: 'Jun', count: 201 },
  { month: 'Jul', count: 189 },{ month: 'Ago', count: 220 },{ month: 'Sep', count: 198 },
  { month: 'Oct', count: 245 },{ month: 'Nov', count: 232 },{ month: 'Dic', count: 267 },
];

const SPECIALTY_DATA = [
  { specialty: 'Med. General', count: 45 },
  { specialty: 'Cardiología', count: 28 },
  { specialty: 'Pediatría', count: 35 },
  { specialty: 'Dermatología', count: 22 },
  { specialty: 'Neurología', count: 18 },
];

const STATUS_BADGE: Record<string, { variant: 'warning' | 'info' | 'purple' | 'success' | 'danger' | 'default'; label: string }> = {
  pending:     { variant: 'warning', label: 'Pendiente' },
  confirmed:   { variant: 'info',    label: 'Confirmada' },
  in_progress: { variant: 'purple',  label: 'En proceso' },
  completed:   { variant: 'success', label: 'Completada' },
  cancelled:   { variant: 'danger',  label: 'Cancelada' },
  no_show:     { variant: 'default', label: 'No asistió' },
};

export default function DashboardPage() {
  const { profile, role } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
    refetchInterval: 60_000,
  });

  const { data: upcoming } = useQuery({
    queryKey: ['upcoming-appointments'],
    queryFn: () => appointmentsService.getUpcoming(6),
    refetchInterval: 30_000,
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {greeting()}, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          {role === 'admin' && (
            <Link to="/admin/reports">
              <Button variant="outline" size="sm" icon={<Activity className="w-4 h-4" />}>Ver reportes</Button>
            </Link>
          )}
          <Link to="/appointments/new">
            <Button size="sm" icon={<Calendar className="w-4 h-4" />}>Nueva cita</Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Pacientes" value={stats?.total_patients ?? '—'} icon={Users} color="bg-primary-500" change={12} />
        <StatCard title="Médicos activos" value={stats?.active_doctors ?? '—'} icon={Stethoscope} color="bg-medical-teal" change={5} />
        <StatCard title="Citas programadas" value={stats?.scheduled_appointments ?? '—'} icon={Calendar} color="bg-medical-amber" />
        <StatCard title="Consultas" value={stats?.completed_consultations ?? '—'} icon={CheckCircle} color="bg-medical-green" change={8} />
        <StatCard title="Videollamadas" value={stats?.video_calls_done ?? '—'} icon={Video} color="bg-medical-purple" change={22} />
        <StatCard title="Ingresos est." value={formatCurrency(stats?.monthly_revenue ?? 0)} icon={DollarSign} color="bg-medical-red" subtitle="Este mes" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patients trend */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <h3 className="font-semibold text-gray-900 dark:text-white">Pacientes por mes</h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={MONTHLY_PATIENTS}>
                  <defs>
                    <linearGradient id="colorPat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a56db" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1a56db" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#1a56db" fill="url(#colorPat)" strokeWidth={2} name="Pacientes" />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>

        {/* Specialty pie */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-white">Citas por especialidad</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={SPECIALTY_DATA} dataKey="count" nameKey="specialty" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {SPECIALTY_DATA.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-600 dark:text-gray-400">{v}</span>} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Upcoming appointments + bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Próximas citas</h3>
              </div>
              <Link to="/appointments" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                Ver todas <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              {!upcoming || upcoming.length === 0 ? (
                <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">No hay citas próximas</div>
              ) : (
                <ul className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {upcoming.map(appt => (
                    <li key={appt.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <Avatar name={appt.patient?.first_name + ' ' + appt.patient?.last_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {appt.patient?.first_name} {appt.patient?.last_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Dr. {appt.doctor?.profile?.full_name} · {appt.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{formatDateTime(appt.scheduled_at)}</p>
                        <Badge variant={STATUS_BADGE[appt.status]?.variant ?? 'default'} className="mt-0.5">
                          {STATUS_BADGE[appt.status]?.label ?? appt.status}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Doctor occupancy */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-white">Ocupación médica</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SPECIALTY_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="specialty" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#1a56db" radius={[0, 6, 6, 0]} name="Citas" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
