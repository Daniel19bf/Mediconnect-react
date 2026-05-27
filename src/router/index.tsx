import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute }      from './RoleRoute';
import { MainLayout }     from '../components/layout/MainLayout';
import { AuthLayout }     from '../components/layout/AuthLayout';

// Pages – Auth
import LoginPage          from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from '../pages/auth/ResetPasswordPage';

// Pages – Shared
import DashboardPage      from '../pages/shared/DashboardPage';
import ProfilePage        from '../pages/shared/ProfilePage';
import NotFoundPage       from '../pages/shared/NotFoundPage';

// Pages – Patients
import PatientsPage       from '../pages/shared/PatientsPage';
import PatientDetailPage  from '../pages/shared/PatientDetailPage';
import MedicalHistoryPage from '../pages/shared/MedicalHistoryPage';

// Pages – Doctors
import DoctorsPage        from '../pages/shared/DoctorsPage';
import DoctorDetailPage   from '../pages/shared/DoctorDetailPage';

// Pages – Appointments
import AppointmentsPage   from '../pages/shared/AppointmentsPage';
import NewAppointmentPage from '../pages/shared/NewAppointmentPage';

// Pages – Clinical
import ConsultationPage   from '../pages/doctor/ConsultationPage';
import PrescriptionsPage  from '../pages/shared/PrescriptionsPage';
import ResultsPage        from '../pages/shared/ResultsPage';

// Pages – Communication
import ChatPage           from '../pages/shared/ChatPage';
import VideoCallPage      from '../pages/shared/VideoCallPage';

// Pages – Admin
import AdminPage          from '../pages/admin/AdminPage';
import UsersAdminPage     from '../pages/admin/UsersAdminPage';
import SpecialtiesPage    from '../pages/admin/SpecialtiesPage';
import ReportsPage        from '../pages/admin/ReportsPage';
import AuditPage          from '../pages/admin/AuditPage';
import SystemConfigPage   from '../pages/admin/SystemConfigPage';

export const router = createBrowserRouter([
  // Auth routes
  {
    element: <AuthLayout />,
    children: [
      { path: '/login',           element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password',  element: <ResetPasswordPage /> },
    ],
  },

  // Protected routes
  {
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard',    element: <DashboardPage /> },
      { path: '/profile',      element: <ProfilePage /> },

      // Patients
      { path: '/patients',          element: <PatientsPage /> },
      { path: '/patients/:id',      element: <PatientDetailPage /> },
      { path: '/patients/:id/history', element: <MedicalHistoryPage /> },

      // Doctors
      { path: '/doctors',       element: <DoctorsPage /> },
      { path: '/doctors/:id',   element: <DoctorDetailPage /> },

      // Appointments
      { path: '/appointments',     element: <AppointmentsPage /> },
      { path: '/appointments/new', element: <NewAppointmentPage /> },

      // Clinical
      { path: '/consultation/:appointmentId', element: <RoleRoute roles={['admin','doctor']}><ConsultationPage /></RoleRoute> },
      { path: '/prescriptions', element: <PrescriptionsPage /> },
      { path: '/results',       element: <ResultsPage /> },

      // Communication
      { path: '/chat',          element: <ChatPage /> },
      { path: '/chat/:userId',  element: <ChatPage /> },
      { path: '/video/:appointmentId', element: <VideoCallPage /> },

      // Admin
      { path: '/admin',         element: <RoleRoute roles={['admin']}><AdminPage /></RoleRoute> },
      { path: '/admin/users',   element: <RoleRoute roles={['admin']}><UsersAdminPage /></RoleRoute> },
      { path: '/admin/specialties', element: <RoleRoute roles={['admin']}><SpecialtiesPage /></RoleRoute> },
      { path: '/admin/reports', element: <RoleRoute roles={['admin']}><ReportsPage /></RoleRoute> },
      { path: '/admin/audit',   element: <RoleRoute roles={['admin']}><AuditPage /></RoleRoute> },
      { path: '/admin/config',  element: <RoleRoute roles={['admin']}><SystemConfigPage /></RoleRoute> },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);
