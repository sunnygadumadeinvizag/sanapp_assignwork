import { getSession } from '@/lib/utils/session.utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function TasksPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/api/auth/login');
  }

  const mockTasks = [
    { id: 1, title: 'Complete project documentation', status: 'In Progress', priority: 'High' },
    { id: 2, title: 'Review pull requests', status: 'Pending', priority: 'Medium' },
    { id: 3, title: 'Update dependencies', status: 'Completed', priority: 'Low' },
  ];

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Tasks</h1>
          <p className="text-muted-foreground">Manage your work assignments</p>
        </div>
        <Button>Create New Task</Button>
      </div>

      <div className="grid gap-4">
        {mockTasks.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{task.title}</CardTitle>
                  <CardDescription>Task #{task.id}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    task.priority === 'High' ? 'bg-red-100 text-red-800' :
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">View Details</Button>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
