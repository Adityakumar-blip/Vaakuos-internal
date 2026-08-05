import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, Download, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useGetFinanceStatsQuery } from '@/store/api/financeApi';
import { Loader2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/format';

const OwnerBilling = () => {
    const { data: stats, isLoading, isError } = useGetFinanceStatsQuery();

    const statsCurrency = stats?.totalRevenue.currency || 'INR';
    const statsLocale = 'en-IN';

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Billing & Finance</h1>
                <p className="text-muted-foreground mt-2">Manage subscriptions, invoices, and financial overview.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue.value || 0, statsCurrency, statsLocale)}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className={`${(stats?.totalRevenue.growth || 0) >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                                {(stats?.totalRevenue.growth || 0) >= 0 ? '+' : ''}{stats?.totalRevenue.growth}% 
                                {(stats?.totalRevenue.growth || 0) >= 0 ? <ArrowUpRight className="h-4 w-4 inline ml-1" /> : <ArrowDownRight className="h-4 w-4 inline ml-1" />}
                            </span>{' '}
                            from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(stats?.activeSubscriptions.value || 0, statsLocale)}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className={`${(stats?.activeSubscriptions.growth || 0) >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                                {(stats?.activeSubscriptions.growth || 0) >= 0 ? '+' : ''}{stats?.activeSubscriptions.growth}% 
                                {(stats?.activeSubscriptions.growth || 0) >= 0 ? <ArrowUpRight className="h-4 w-4 inline ml-1" /> : <ArrowDownRight className="h-4 w-4 inline ml-1" />}
                            </span>{' '}
                            from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(stats?.pendingInvoices.value || 0, statsLocale)}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className={`${(stats?.pendingInvoices.growth || 0) >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                                {(stats?.pendingInvoices.growth || 0) >= 0 ? '+' : ''}{stats?.pendingInvoices.growth}% 
                                {(stats?.pendingInvoices.growth || 0) >= 0 ? <ArrowUpRight className="h-4 w-4 inline ml-1" /> : <ArrowDownRight className="h-4 w-4 inline ml-1" />}
                            </span>{' '}
                            from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Revenue / User</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats?.arpu.value || 0, statsCurrency, statsLocale)}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className={`${(stats?.arpu.growth || 0) >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                                {(stats?.arpu.growth || 0) >= 0 ? '+' : ''}{stats?.arpu.growth}% 
                                {(stats?.arpu.growth || 0) >= 0 ? <ArrowUpRight className="h-4 w-4 inline ml-1" /> : <ArrowDownRight className="h-4 w-4 inline ml-1" />}
                            </span>{' '}
                            from last month
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="invoices" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="methods">Payment Methods</TabsTrigger>
                    <TabsTrigger value="settings">Billing Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="invoices" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Invoices</CardTitle>
                            <CardDescription>
                                A list of recent invoices for your system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {[
                                    { id: 'INV001', amount: '$250.00', status: 'Paid', date: '2024-01-15' },
                                    { id: 'INV002', amount: '$150.00', status: 'Pending', date: '2024-01-16' },
                                    { id: 'INV003', amount: '$450.00', status: 'Paid', date: '2024-01-14' },
                                    { id: 'INV004', amount: '$120.00', status: 'Failed', date: '2024-01-12' },
                                    { id: 'INV005', amount: '$300.00', status: 'Paid', date: '2024-01-10' },
                                ].map((invoice, i) => (
                                    <div key={i} className="flex items-center">
                                        <div className="grid gap-1 flex-1">
                                            <p className="text-sm font-medium leading-none">
                                                Invoice #{invoice.id}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {invoice.date}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant={invoice.status === 'Paid' ? 'outline' : invoice.status === 'Pending' ? 'secondary' : 'destructive'} className={invoice.status === 'Paid' ? 'border-green-500 text-green-500' : ''}>
                                                {invoice.status}
                                            </Badge>
                                            <div className="w-[80px] text-right font-medium">{invoice.amount}</div>
                                            <Button variant="ghost" size="icon">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="methods">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Methods</CardTitle>
                            <CardDescription>Manage your payment methods.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Visa ending in 4242</p>
                                        <p className="text-sm text-muted-foreground">Expiry 12/2025</p>
                                    </div>
                                </div>
                                <Badge>Default</Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Mastercard ending in 8888</p>
                                        <p className="text-sm text-muted-foreground">Expiry 08/2026</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing Settings</CardTitle>
                            <CardDescription>Configure billing preferences.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Billing settings content placeholder.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default OwnerBilling;
