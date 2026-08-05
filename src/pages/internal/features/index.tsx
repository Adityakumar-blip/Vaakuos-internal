import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FlaskConical, Rocket, Shield, Zap, LucideIcon } from 'lucide-react';

interface FeatureCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    status: string;
    defaultChecked?: boolean;
}

const FeatureCard = ({ title, description, icon: Icon, status, defaultChecked = false }: FeatureCardProps) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">{title}</CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant={status === 'Stable' ? 'outline' : status === 'Beta' ? 'secondary' : 'default'} className={status === 'Beta' ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' : ''}>
                            {status}
                        </Badge>
                    </div>
                </div>
            </div>
            <Switch defaultChecked={defaultChecked} />
        </CardHeader>
        <CardContent>
            <CardDescription className="mt-2 text-sm">
                {description}
            </CardDescription>
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Last updated 2 days ago</p>
                <Button variant="ghost" size="sm" className="h-8 text-xs">Configure</Button>
            </div>
        </CardContent>
    </Card>
);

const OwnerFeatures = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Feature Management</h1>
                <p className="text-muted-foreground mt-2">Control system-wide features and rollouts.</p>
            </div>

            <div className="grid gap-6">
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold tracking-tight">Core Features</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <FeatureCard
                            title="Advanced Analytics"
                            description="Enable deep-dive analytics for all brand dashboards."
                            icon={Zap}
                            status="Stable"
                            defaultChecked={true}
                        />
                        <FeatureCard
                            title="Multi-Tenant Support"
                            description="Allow agencies to create sub-tenants."
                            icon={Shield}
                            status="Stable"
                            defaultChecked={true}
                        />
                        <FeatureCard
                            title="API Rate Limiting"
                            description="Enforce global rate limits on public APIs."
                            icon={Shield}
                            status="Stable"
                            defaultChecked={true}
                        />
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold tracking-tight">Beta / Experimental</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <FeatureCard
                            title="AI Content Generation"
                            description="Generative AI tools for template creation."
                            icon={Rocket}
                            status="Beta"
                            defaultChecked={false}
                        />
                        <FeatureCard
                            title="Real-time Collaboration"
                            description="Websocket-based live cursor and editing."
                            icon={FlaskConical}
                            status="Alpha"
                            defaultChecked={false}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
};

export default OwnerFeatures;
