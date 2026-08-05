import { ComponentType, lazy, LazyExoticComponent } from 'react';

export interface AppRoute {
  path: string;
  component: LazyExoticComponent<ComponentType<unknown>>;
}

// Use relative path to ensure it works across environments
const pages = import.meta.glob('../pages/internal/**/*.tsx');

/**
 * Normalizes a file path to a route path
 * @param filePath The relative file path from glob (e.g., ../pages/internal/dashboard/index.tsx)
 * @param section The base section (e.g., brand)
 */
const normalizeRoutePath = (filePath: string, section: string): string => {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const parts = normalizedPath.split('/');
  
  // Find the index of the section name (e.g., 'brand', 'agency', 'owner')
  const sectionIndex = parts.indexOf(section);
  if (sectionIndex === -1) return '';

  // Join the parts following the section name
  let relativePath = parts.slice(sectionIndex + 1).join('/');
  
  // Remove file extension
  relativePath = relativePath.replace(/\.tsx$/, '');

  // Handle 'index' files - they map to the parent directory path
  if (relativePath === 'index') {
    return '';
  }
  if (relativePath.endsWith('/index')) {
    relativePath = relativePath.substring(0, relativePath.lastIndexOf('/index'));
  }

  // Handle dynamic segments [id] -> :id
  relativePath = relativePath.replace(/\[([^\]]+)\]/g, ':$1');

  return relativePath;
};

/**
 * Scans every page under src/pages/internal into a route.
 */
export const getRoutesForSection = (section: string): AppRoute[] => {
  const routes: AppRoute[] = [];
  const sectionLower = section.toLowerCase();

  for (const path in pages) {
    const pathLower = path.toLowerCase();
    // Check if path contains the section folder
    if (pathLower.includes(`/pages/${sectionLower}/`)) {
        // Skip components or special files that start with _
        if (path.includes('/_')) continue;

        const routePath = normalizeRoutePath(path, section);
        
        // Lazy load the component
        const Component = lazy(pages[path] as () => Promise<{ default: ComponentType<unknown> }>);

        routes.push({
          path: routePath,
          component: Component
        });
    }
  }

  // Sort: Static paths first, then specific dynamic, then catch-all
  return routes.sort((a, b) => {
    // Empty path (index) comes first
    if (a.path === '' && b.path !== '') return -1;
    if (a.path !== '' && b.path === '') return 1;

    const aSegments = a.path.split('/');
    const bSegments = b.path.split('/');
    
    const len = Math.max(aSegments.length, bSegments.length);
    for (let i = 0; i < len; i++) {
        const segA = aSegments[i] || '';
        const segB = bSegments[i] || '';
        
        const isDynamicA = segA.startsWith(':');
        const isDynamicB = segB.startsWith(':');
        
        if (!isDynamicA && isDynamicB) return -1;
        if (isDynamicA && !isDynamicB) return 1;
        
        if (segA < segB) return -1;
        if (segA > segB) return 1;
    }
    return 0;
  });
};
