import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAgenciesQuery } from '@/store/api/agencyApi';
import { Building, DollarSign, TrendingUp, Users, Loader2, RotateCcw } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

export default function AgenciesManagement() {
    const { data: agencies = [], isLoading, error, refetch } = useGetAgenciesQuery();

    const totalRevenue = useMemo(() => 
        agencies.reduce((acc, agency) => acc + (agency.revenue || 0), 0), 
    [agencies]);

    const activeAgencies = useMemo(() => 
        agencies.filter(a => a.status === 'active').length, 
    [agencies]);

    const suspendedAgencies = useMemo(() => 
        agencies.filter(a => a.status === 'suspended').length, 
    [agencies]);

    const totalAgenciesCount = useMemo(() => agencies.length, [agencies]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-4 w-48 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-6 w-48" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-8 w-24" />
                                        <Skeleton className="h-8 w-24" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-4">
                                    {[...Array(4)].map((_, j) => (
                                        <div key={j} className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-6 w-16" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="text-destructive font-medium text-lg">
                    Error loading agencies. Please try again later.
                </div>
                <Button variant="outline" onClick={() => refetch()}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Agencies Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage all agencies and their subscriptions
                    </p>
                </div>
                <Button>
                    <Building className="h-4 w-4 mr-2" />
                    Add Agency
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Agencies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAgenciesCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeAgencies}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Suspended</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{suspendedAgencies}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalRevenue / 1000)}K</div>
                    </CardContent>
                </Card>
            </div>

            {/* Agencies List */}
            <div className="grid gap-4">
                {agencies.map((agency) => (
                    <Card key={agency.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-3">
                                        {agency.name}
                                        <Badge variant={agency.status === 'active' ? 'default' : 'destructive'}>
                                            {agency.status}
                                        </Badge>
                                        {agency.pricingTier && <Badge variant="secondary">{agency.pricingTier}</Badge>}
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        Created on {new Date(agency.createdAt).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">View Details</Button>
                                    <Button variant="outline" size="sm">Manage</Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Credit Balance</p>
                                    <p className="text-lg font-semibold flex items-center gap-1">
                                        <DollarSign className="h-4 w-4" />
                                        {(agency.creditBalance || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Revenue Generated</p>
                                    <p className="text-lg font-semibold text-green-600 flex items-center gap-1">
                                        <TrendingUp className="h-4 w-4" />
                                        {formatCurrency(agency.revenue || 0)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Brands</p>
                                    <p className="text-lg font-semibold flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {agency.brandsCount || 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Actions</p>
                                    <div className="flex gap-2 mt-1">
                                        {agency.status === 'active' ? (
                                            <Button variant="destructive" size="sm">Suspend</Button>
                                        ) : (
                                            <Button variant="default" size="sm">Activate</Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

