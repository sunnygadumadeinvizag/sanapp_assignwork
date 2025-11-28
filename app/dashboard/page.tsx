import { getSession } from '@/lib/utils/session.utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import IIPELayout from '../components/IIPELayout';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/api/auth/login');
  }

  const userSession = {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.username,
    accessToken: session.accessToken,
  };

  return (
    <IIPELayout session={userSession} showMenuBar={true}>
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AssignWork Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session.user.username}!</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                  <dd className="text-sm">{session.user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Username</dt>
                  <dd className="text-sm">{session.user.username}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">User ID</dt>
                  <dd className="text-sm font-mono text-xs">{session.user.id}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Tasks assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">You have no tasks assigned yet.</p>
              <Button variant="outline" size="sm">View All Tasks</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" size="sm">Create Task</Button>
              <Button variant="outline" className="w-full" size="sm">View Reports</Button>
              <form action="/api/auth/logout" method="POST">
                <Button variant="destructive" className="w-full" size="sm" type="submit">
                  Logout
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>Current session details</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Access Token</dt>
                <dd className="text-xs font-mono break-all">{session.accessToken.substring(0, 50)}...</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Expires At</dt>
                <dd className="text-sm">{new Date(session.expiresAt).toLocaleString()}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </IIPELayout>
  );
}
