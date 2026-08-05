import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Save } from 'lucide-react';

interface ConfigSectionProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

const ConfigSection = ({ title, description, children }: ConfigSectionProps) => (
    <div className="grid gap-4 py-4">
        <div className="space-y-1">
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="grid gap-4 p-4 border rounded-lg bg-card">
            {children}
        </div>
    </div>
);

const OwnerConfig = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
                    <p className="text-muted-foreground mt-2">Manage global settings, security policies, and environment variables.</p>
                </div>
                <Button>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="email">Email & Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>Basic system information and identity.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <ConfigSection title="Identity" description="Platform name and branding details.">
                                <div className="grid gap-2">
                                    <Label htmlFor="platform-name">Platform Name</Label>
                                    <Input id="platform-name" defaultValue="VaakuOS" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="support-email">Support Email</Label>
                                    <Input id="support-email" defaultValue="support@vaakuos.com" />
                                </div>
                            </ConfigSection>
                            <Separator />
                            <ConfigSection title="Localization" description="Default language and timezone.">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Default Language</Label>
                                        <Select defaultValue="en">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en">English (US)</SelectItem>
                                                <SelectItem value="es">Spanish</SelectItem>
                                                <SelectItem value="fr">French</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Timezone</Label>
                                        <Select defaultValue="utc">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select timezone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="utc">UTC (GMT+0)</SelectItem>
                                                <SelectItem value="est">EST (GMT-5)</SelectItem>
                                                <SelectItem value="ist">IST (GMT+5:30)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </ConfigSection>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Policies</CardTitle>
                            <CardDescription>Authentication and session management.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <ConfigSection title="Authentication" description="Password and login policies.">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Require 2FA</Label>
                                        <p className="text-xs text-muted-foreground">Force two-factor authentication for all admins.</p>
                                    </div>
                                    <Switch />
                                </div>
                                <Separator className="my-2" />
                                <div className="grid gap-2">
                                    <Label>Session Timeout (minutes)</Label>
                                    <Input type="number" defaultValue="60" className="max-w-[150px]" />
                                </div>
                            </ConfigSection>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="email">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Settings</CardTitle>
                            <CardDescription>SMTP and template configuration.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Email configuration placeholder.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default OwnerConfig;
