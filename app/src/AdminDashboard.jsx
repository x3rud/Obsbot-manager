import { Toaster } from 'react-hot-toast';
import { DashboardProvider, useDashboardContext } from '@/context/DashboardContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import GroupCard from '@/components/dashboard/GroupCard';

function DashboardContent() {
  const { groups } = useDashboardContext();

  return (
    <div className="p-6 min-h-screen">
      <Toaster />
      <DashboardHeader />
      {groups.length === 0 ? (
        <p className="text-gray-400">No groups available.</p>
      ) : (
        groups.map(group => <GroupCard key={group.id} group={group} />)
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
