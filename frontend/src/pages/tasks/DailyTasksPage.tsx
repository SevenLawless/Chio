import TaskManagementPanel from '../../components/tasks/TaskManagementPanel';
import SelectedTasksPanel from '../../components/tasks/SelectedTasksPanel';

const DailyTasksPage = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Panel - Task Management */}
      <div className="lg:border-r lg:border-brand-800/30 lg:pr-6">
        <TaskManagementPanel />
      </div>

      {/* Right Panel - Selected Tasks */}
      <div className="lg:pl-6">
        <SelectedTasksPanel />
      </div>
    </div>
  );
};

export default DailyTasksPage;
