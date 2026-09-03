import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppLayout from '../app/AppLayout'
import CategorySel from '../pages/CategorySelPage'
import LoginPage from '../pages/LoginPage'
import SettingsPage from '../pages/SettingsPage'
import DashboardPage from '../pages/DashboardPage'
import HomePage from '../pages/HomePage'
import FireFightingEquipmentInspectionRegisterPage from '../pages/FireFightingEquipmentInspectionRegisterPage'
import FirstAidBoxContentsChecklistPage from '../pages/FirstAidBoxContentsChecklistPage'
import HealthSafetyAnalyticsDashboard from '../pages/HealthSafetyAnalyticsDashboard'
import HealthSafetyHistoryPage from '../pages/HealthSafetyHistoryPage'
import HealthAndWealthPage from '../pages/HealthAndWealthPage'
import LocationListPage from '../pages/LocationListPage'
import AtfsPage from '../pages/AtfsPage'
import DcefPage from '../pages/DcefPage'
import CsslPage from '../pages/CsslPage'
import InspectionsPage from '../pages/InspectionsPage'
import NotFoundPage from '../pages/NotFoundPage'
import SetPasswordPage from '../pages/SetPasswordPage'
import VehiclesForkliftDailyInspectionPage from '../pages/VehiclesForkliftDailyInspectionPage'
import ProtectedRoute from './ProtectedRoute'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'home',
            element: <HomePage />,
          },
          {
            path: 'locations',
            element: <LocationListPage />,
          },
          {
            path: 'set-password',
            element: <SetPasswordPage />,
          },
          {
            path: 'dashboard',
            element: <CategorySel />,
          },
          {
            path: 'overview',
            element: <DashboardPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
          {
            path: 'inspections',
            element: <InspectionsPage inspectionType="IT Inspections" />,
          },
          {
            path: 'inspections/it',
            element: <InspectionsPage inspectionType="IT Inspections" />,
          },
          {
            path: 'inspections/health-safety',
            element: <HealthSafetyAnalyticsDashboard />,
          },
          {
            path: 'inspections/health-safety/history',
            element: <HealthSafetyHistoryPage />,
          },
          {
            path: 'inspections/health-safety/first-aid-box-contents',
            element: <FirstAidBoxContentsChecklistPage />,
          },
          {
            path: 'inspections/health-safety/vehicles-forklift-daily',
            element: <VehiclesForkliftDailyInspectionPage />,
          },
          {
            path: 'inspections/health-safety/fire-fighting-equipment-register',
            element: <FireFightingEquipmentInspectionRegisterPage />,
          },
          {
            path: 'inspections/health-safety/atfs',
            element: <AtfsPage />,
          },
          {
            path: 'inspections/health-safety/dcef',
            element: <DcefPage />,
          },
          {
            path: 'inspections/health-safety/cssl',
            element: <CsslPage />,
          },
          {
            path: 'inspections/risk',
            element: <InspectionsPage inspectionType="Risk Inspections" />,
          },
          {
            path: 'healthandwealth',
            element: <HealthAndWealthPage />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])

function AppRouter() {
  return <RouterProvider router={router} />
}

export default AppRouter
