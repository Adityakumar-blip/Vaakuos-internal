import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import {
    BuildingOfficeIcon as Building,
    BuildingOffice2Icon as Building2,
    ChatBubbleBottomCenterTextIcon as MessageSquare,
    CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { useGetOwnerOverviewQuery } from '@/store/api/dashboardApi';

export default function OwnerDashboard() {
    const { user } = useAuth();
    const { data, isLoading, isError, refetch } = useGetOwnerOverviewQuery();

    const stats = [
        { title: 'Total Agencies', value: data?.totalAgencies, icon: Building, color: 'text-blue-600' },
        { title: 'Total Brands', value: data?.totalBrands, icon: Building2, color: 'text-green-600' },
        { title: 'Active Brands', value: data?.activeBrands, icon: CheckBadgeIcon, color: 'text-emerald-600' },
        { title: 'Messages Today', value: data?.messagesToday, icon: MessageSquare, color: 'text-purple-600' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Global Overview</h1>
                <p className="text-muted-foreground mt-2">
                    Welcome back, {user?.name}! System-wide metrics.
                </p>
            </div>

            {isError ? (
                <Card>
                    <CardContent className="py-10 text-center">
                        <p className="font-medium">Couldn't load platform metrics</p>
                        <Button variant="outline" className="mt-4" onClick={() => refetch()}>Retry</Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <Card key={stat.title}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                        <Icon className={`h-4 w-4 ${stat.color}`} />
                                    </CardHeader>
                                    <CardContent>
                                        {isLoading ? (
                                            <Skeleton className="h-8 w-20" />
                                        ) : (
                                            <div className="text-2xl font-bold">
                                                {(stat.value ?? 0).toLocaleString()}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Top agencies by brand count */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Agencies</CardTitle>
                            <CardDescription>By number of brands managed</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full" />
                                    ))}
                                </div>
                            ) : data && data.topAgencies.length > 0 ? (
                                <div className="space-y-1">
                                    {data.topAgencies.map((agency) => (
                                        <div key={agency.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <p className="font-medium">{agency.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {agency.brandCount} {agency.brandCount === 1 ? 'brand' : 'brands'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground py-4">No agencies yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
