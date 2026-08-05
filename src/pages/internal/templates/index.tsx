import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileCheck, AlertTriangle } from 'lucide-react';

export default function TemplateModeration() {
    const templates = [
        { id: '1', name: 'Summer Sale', brand: 'Fashion Store', category: 'Marketing', status: 'pending', spamRisk: true, submittedAt: '2024-01-19' },
        { id: '2', name: 'Order Confirmation', brand: 'Acme Corp', category: 'Transactional', status: 'pending', spamRisk: false, submittedAt: '2024-01-19' },
        { id: '3', name: 'Shipping Update', brand: 'Tech Brand', category: 'Transactional', status: 'approved', spamRisk: false, submittedAt: '2024-01-18' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Template Moderation</h1>
                <p className="text-muted-foreground mt-2">Review and approve template requests</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">12</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">8</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">3</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4">
                {templates.map((template) => (
                    <Card key={template.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-3">
                                        <FileCheck className="h-5 w-5" />
                                        {template.name}
                                        <Badge variant={template.status === 'pending' ? 'secondary' : 'default'}>{template.status}</Badge>
                                        {template.spamRisk && (
                                            <Badge variant="destructive" className="flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                Spam Risk
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        {template.brand} • {template.category} • Submitted {template.submittedAt}
                                    </CardDescription>
                                </div>
                                {template.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <Button variant="default" size="sm">Approve</Button>
                                        <Button variant="destructive" size="sm">Reject</Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
}
