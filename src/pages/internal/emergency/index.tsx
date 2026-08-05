import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, ShieldAlert, Trash2, Power, Lock, RefreshCcw } from 'lucide-react';

interface DangerZoneItemProps {
    title: string;
    description: string;
    actionText: string;
    icon: React.ElementType;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

const DangerZoneItem = ({ title, description, actionText, icon: Icon, variant = 'destructive' }: DangerZoneItemProps) => (
    <div className="flex items-center justify-between py-4">
        <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full ${variant === 'destructive' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/20'}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <h4 className="font-medium text-base">{title}</h4>
                <p className="text-sm text-muted-foreground max-w-xl">{description}</p>
            </div>
        </div>
        <Button variant={variant} disabled={variant === 'outline'}>
            {actionText}
        </Button>
    </div>
);

const OwnerEmergency = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-red-600 flex items-center gap-3">
                    <ShieldAlert className="h-8 w-8" />
                    Emergency Controls
                </h1>
                <p className="text-muted-foreground mt-2">
                    Advanced controls for system emergencies. <span className="font-bold text-red-500">Proceed with extreme caution.</span>
                </p>
            </div>

            <Alert variant="destructive" className="border-red-600/50 bg-red-500/10 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning: Production Environment</AlertTitle>
                <AlertDescription>
                    You are currently logged into the production environment. Actions taken here can cause data loss or system downtime.
                </AlertDescription>
            </Alert>

            <Card className="border-red-200 dark:border-red-900">
                <CardHeader>
                    <CardTitle className="text-red-600">System State</CardTitle>
                    <CardDescription>Control the global availability of the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="rounded-lg border p-4 bg-muted/50">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-medium">Current Status</span>
                            <Badge className="bg-green-500 hover:bg-green-600">Operational</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            System is accepting all connections and processing queues normally.
                        </p>
                    </div>

                    <Separator />

                    <DangerZoneItem
                        title="Maintenance Mode"
                        description="Reject all new connections and show a maintenance page to users. Admin API will remain accessible."
                        actionText="Enable Maintenance"
                        icon={Power}
                        variant="destructive"
                    />

                    <Separator />

                    <DangerZoneItem
                        title="Lockdown Mode"
                        description="Revoke all active sessions except for Owner admins. Useful in case of a security breach."
                        actionText="Initiate Lockdown"
                        icon={Lock}
                        variant="destructive"
                    />

                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Data & Services</CardTitle>
                    <CardDescription>Manage cache and service states.</CardDescription>
                </CardHeader>
                <CardContent className="divide-y">
                    <DangerZoneItem
                        title="Flush Redis Cache"
                        description="Clear all cached data. This may cause temporary performance degradation."
                        actionText="Flush Cache"
                        icon={RefreshCcw}
                        variant="outline" // Amber/Warning style usually but Shadcn defaults are strictly destructive or not
                    />
                    <DangerZoneItem
                        title="Purge Audit Logs"
                        description="Permanently delete system audit logs older than 90 days. This action cannot be undone."
                        actionText="Purge Logs"
                        icon={Trash2}
                        variant="destructive"
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default OwnerEmergency;
