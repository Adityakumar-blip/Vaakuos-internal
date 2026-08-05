import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Server, Database, Globe, Cpu, MemoryStick, AlertTriangle, CheckCircle2 } from 'lucide-react';

const StatusCard = ({ title, status, icon: Icon, details }: any) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-4 w-4 ${status === 'Healthy' ? 'text-green-500' : status === 'Warning' ? 'text-amber-500' : 'text-red-500'}`} />
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-2 mb-2">
                <div className={`text-2xl font-bold`}>{status}</div>
            </div>
            <p className="text-xs text-muted-foreground">{details}</p>
        </CardContent>
    </Card>
);

const MetricCard = ({ title, value, subtext, percentage }: any) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold mb-2">{value}</div>
            <Progress value={percentage} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">{subtext}</p>
        </CardContent>
    </Card>
);

const OwnerMonitoring = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
                    <p className="text-muted-foreground mt-2">Real-time health status and performance metrics.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-sm text-muted-foreground">Systems Operational</span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatusCard title="API Gateway" status="Healthy" icon={Globe} details="99.99% Uptime (30d)" />
                <StatusCard title="Database Cluster" status="Healthy" icon={Database} details="Latency: 45ms" />
                <StatusCard title="Redis Cache" status="Healthy" icon={Server} details="Hit Rate: 94%" />
                <StatusCard title="Background Workers" status="Warning" icon={Activity} details="High Load: Process Queue" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <MetricCard title="CPU Usage" value="45%" percentage={45} subtext="Average utilization across cluster" />
                <MetricCard title="Memory Usage" value="128 GB / 256 GB" percentage={50} subtext="50% Total Capacity" />
                <MetricCard title="Storage" value="4.2 TB / 10 TB" percentage={42} subtext="S3 Bucket & Local SSD" />
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Throughput (RPM)</CardTitle>
                        <CardDescription>Requests per minute over the last hour.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-md">
                        <p className="text-muted-foreground">Chart Placeholder</p>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Alerts</CardTitle>
                        <CardDescription>System notices and warnings.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-4">
                                {[
                                    { title: "High Memory Usage", time: "2 mins ago", type: "warning" },
                                    { title: "API Latency Spike", time: "15 mins ago", type: "critical" },
                                    { title: "Backup Completed", time: "1 hour ago", type: "success" },
                                    { title: "New Node Added", time: "2 hours ago", type: "info" },
                                    { title: "Deploy Successful", time: "5 hours ago", type: "success" },
                                ].map((alert, i) => (
                                    <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                                        <AlertTriangle className={`h-4 w-4 mt-1 ${alert.type === 'critical' ? 'text-red-500' : alert.type === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">{alert.title}</p>
                                            <p className="text-xs text-muted-foreground">{alert.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default OwnerMonitoring;
