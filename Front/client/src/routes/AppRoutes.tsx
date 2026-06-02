import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AdminProfilePage } from '../pages/AdminProfilePage';
import { DashboardPage } from '../pages/DashboardPage';
import { Login } from '../pages/Login';
import { PatientDetailsPage } from '../pages/PatientDetailsPage';
import { PatientsPage } from '../pages/PatientsPage';
import { RegisterPatientPage } from '../pages/RegisterPatientPage';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pacientes" element={<PatientsPage />} />
          <Route path="cadastrar-paciente" element={<RegisterPatientPage />} />
          <Route path="perfil" element={<AdminProfilePage />} />
          <Route path="paciente/:id" element={<PatientDetailsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
