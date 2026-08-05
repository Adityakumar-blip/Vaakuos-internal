import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const PlaceholderPage = ({ title, description }: { title: string; description: string }) => (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-2">{description}</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This page is under construction.</p>
            </CardContent>
        </Card>
    </div>
);

export const OwnerBilling = () => <PlaceholderPage title="Credit Management" description="Manage credit pricing and agency discounts" />;
export const OwnerMonitoring = () => <PlaceholderPage title="Monitoring" description="System-wide monitoring and alerts" />;
export const OwnerLogs = () => <PlaceholderPage title="Logs & Debug" description="View system logs and debug information" />;
export const OwnerFeatures = () => <PlaceholderPage title="Feature Flags" description="Manage feature rollouts and beta access" />;
export const OwnerConfig = () => <PlaceholderPage title="Core Config" description="System configuration and settings" />;
export const OwnerEmergency = () => <PlaceholderPage title="Emergency Controls" description="Emergency system controls and kill switches" />;
