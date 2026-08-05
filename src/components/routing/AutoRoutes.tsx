import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { getRoutesForSection } from '@/utils/routeScanner';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface AutoRoutesProps {
    basePath: string; // 'brand', 'agency', or 'owner'
}

export const AutoRoutes = ({ basePath }: AutoRoutesProps) => {
    const routes = getRoutesForSection(basePath);

    return (
        <Routes>
            {routes.map((route) => (
                <Route
                    key={route.path}
                    path={route.path}
                    index={route.path === ''}
                    element={
                        <Suspense
                            fallback={
                                <div className="flex h-full w-full items-center justify-center p-12">
                                    <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            }
                        >
                            <route.component />
                        </Suspense>
                    }
                />
            ))}
        </Routes>
    );
};
