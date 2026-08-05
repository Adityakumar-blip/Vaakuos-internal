/**
 * Quick Start Guide
 * 
 * This file provides a quick reference for using the Redux API setup
 */

// ============================================================================
// 1. BASIC QUERY (Fetch Data)
// ============================================================================

import { useGetProductsQuery } from '@/store/api/productsApi';

function ProductList() {
  const { data, isLoading, error, refetch } = useGetProductsQuery({
    page: 1,
    limit: 10,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error!</div>;

  return (
    <div>
      {data?.products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}

// ============================================================================
// 2. MUTATION (Create/Update/Delete)
// ============================================================================

import { useCreateProductMutation } from '@/store/api/productsApi';

function CreateProduct() {
  const [createProduct, { isLoading, error }] = useCreateProductMutation();

  const handleSubmit = async (formData) => {
    try {
      const result = await createProduct(formData).unwrap();
      console.log('Success:', result);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}

// ============================================================================
// 3. LAZY QUERY (Manual Trigger)
// ============================================================================

import { useLazySearchProductsQuery } from '@/store/api/productsApi';

function SearchProducts() {
  const [trigger, { data, isLoading }] = useLazySearchProductsQuery();

  const handleSearch = (term: string) => {
    trigger(term);
  };

  return <input onChange={(e) => handleSearch(e.target.value)} />;
}

// ============================================================================
// 4. USING REDUX STATE
// ============================================================================

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCurrentUser, logout } from '@/store/slices/authSlice';

function UserProfile() {
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();

  return (
    <div>
      <h1>{user?.name}</h1>
      <button onClick={() => dispatch(logout())}>Logout</button>
    </div>
  );
}

// ============================================================================
// 5. ERROR HANDLING
// ============================================================================

import { getErrorMessage } from '@/store/api/utils';

function Component() {
  const { data, error } = useGetProductsQuery();

  if (error) {
    const message = getErrorMessage(error);
    return <div>Error: {message}</div>;
  }

  return <div>...</div>;
}

// ============================================================================
// 6. POLLING (Auto-refresh)
// ============================================================================

function LiveData() {
  const { data } = useGetProductsQuery(undefined, {
    pollingInterval: 30000, // Refresh every 30 seconds
  });

  return <div>...</div>;
}

// ============================================================================
// 7. SKIP QUERY (Conditional)
// ============================================================================

function ConditionalFetch({ productId }: { productId?: string }) {
  const { data } = useGetProductByIdQuery(productId!, {
    skip: !productId, // Don't fetch if no ID
  });

  return <div>...</div>;
}

// ============================================================================
// 8. PREFETCHING
// ============================================================================

import { useAppDispatch } from '@/store/hooks';
import { productsApi } from '@/store/api/productsApi';

function ProductCard({ productId }: { productId: string }) {
  const dispatch = useAppDispatch();

  const handleMouseEnter = () => {
    // Prefetch product details on hover
    dispatch(
      productsApi.util.prefetch('getProductById', productId, { force: true })
    );
  };

  return <div onMouseEnter={handleMouseEnter}>...</div>;
}

// ============================================================================
// 9. MANUAL CACHE UPDATE
// ============================================================================

import { useAppDispatch } from '@/store/hooks';
import { productsApi } from '@/store/api/productsApi';

function Component() {
  const dispatch = useAppDispatch();

  const updateCache = (newProduct) => {
    dispatch(
      productsApi.util.updateQueryData('getProducts', undefined, (draft) => {
        draft.products.push(newProduct);
      })
    );
  };

  return <div>...</div>;
}

// ============================================================================
// 10. INVALIDATE CACHE
// ============================================================================

import { useAppDispatch } from '@/store/hooks';
import { productsApi } from '@/store/api/productsApi';

function Component() {
  const dispatch = useAppDispatch();

  const invalidateProducts = () => {
    dispatch(
      productsApi.util.invalidateTags([{ type: 'Product', id: 'LIST' }])
    );
  };

  return <button onClick={invalidateProducts}>Refresh</button>;
}

// ============================================================================
// 11. CREATING A NEW API ENDPOINT
// ============================================================================

/*
Step 1: Copy the template
cp src/store/api/TEMPLATE.ts src/store/api/usersApi.ts

Step 2: Replace placeholders
- Replace 'Resource' with 'User'
- Replace 'resource' with 'user'
- Replace 'resources' with 'users'

Step 3: Define your interface
export interface User {
  id: string;
  name: string;
  email: string;
}

Step 4: Add tag type to apiSlice.ts
tagTypes: ['User', 'Auth', 'Product', ...],

Step 5: Use in components
import { useGetUsersQuery } from '@/store/api/usersApi';
*/

// ============================================================================
// 12. ENVIRONMENT VARIABLES
// ============================================================================

/*
Create .env file:

VITE_API_BASE_URL=http://localhost:3000/api

Or use different URLs for different environments:
- Development: http://localhost:3000/api
- Staging: https://staging-api.example.com/api
- Production: https://api.example.com/api
*/

// ============================================================================
// 13. AUTHENTICATION
// ============================================================================

import { useLoginMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';

function LoginForm() {
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials(result));
      // Redirect to dashboard
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return <form>...</form>;
}

// ============================================================================
// COMMON PATTERNS
// ============================================================================

// Pattern 1: Loading state with skeleton
if (isLoading) {
  return <SkeletonLoader />;
}

// Pattern 2: Error state with retry
if (error) {
  return (
    <ErrorMessage 
      message={getErrorMessage(error)} 
      onRetry={refetch}
    />
  );
}

// Pattern 3: Empty state
if (!data || data.length === 0) {
  return <EmptyState />;
}

// Pattern 4: Success state
return <DataDisplay data={data} />;
