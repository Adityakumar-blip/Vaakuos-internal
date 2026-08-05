# Redux API Setup Documentation

## 📚 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Creating New APIs](#creating-new-apis)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)
7. [Advanced Features](#advanced-features)

---

## Overview

This is a production-grade, modular Redux setup using **Redux Toolkit (RTK)** and **RTK Query** for API management. It provides a plug-and-play architecture for adding new API endpoints with minimal boilerplate.

### Key Features
- ✅ **Automatic Caching** - Smart caching with configurable TTL
- ✅ **Request Deduplication** - Prevents duplicate requests
- ✅ **Optimistic Updates** - Instant UI updates
- ✅ **Auto-Retry** - Exponential backoff retry logic
- ✅ **Token Refresh** - Automatic token refresh on 401
- ✅ **TypeScript** - Full type safety
- ✅ **Modular** - Easy to extend and maintain
- ✅ **Tag-based Invalidation** - Efficient cache management

---

## Architecture

```
src/store/
├── index.ts                 # Store configuration
├── hooks.ts                 # Typed Redux hooks
├── api/
│   ├── apiSlice.ts         # Base API slice with auth & retry
│   ├── authApi.ts          # Authentication endpoints
│   ├── productsApi.ts      # Example: Products endpoints
│   ├── config.ts           # API configuration & constants
│   ├── utils.ts            # Utility functions
│   └── TEMPLATE.ts         # Template for new APIs
└── slices/
    └── authSlice.ts        # Auth state management
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install @reduxjs/toolkit react-redux
```

### 2. Wrap Your App with Redux Provider

Update your `main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
```

### 3. Configure Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## Creating New APIs

### Method 1: Using the Template (Recommended)

1. **Copy the template:**
   ```bash
   cp src/store/api/TEMPLATE.ts src/store/api/usersApi.ts
   ```

2. **Replace placeholders:**
   - Replace `Resource` with `User`
   - Replace `resource` with `user`
   - Replace `resources` with `users`

3. **Define your interface:**
   ```typescript
   export interface User {
     id: string;
     name: string;
     email: string;
     role: string;
   }
   ```

4. **Update tag type in `apiSlice.ts`:**
   ```typescript
   tagTypes: ['User', 'Auth', 'Product', ...],
   ```

5. **Done!** Your API is ready to use.

### Method 2: Manual Creation

```typescript
import { apiSlice } from './apiSlice';

export interface User {
  id: string;
  name: string;
  email: string;
}

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    
    createUser: builder.mutation<User, Partial<User>>({
      query: (newUser) => ({
        url: '/users',
        method: 'POST',
        body: newUser,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useGetUsersQuery, useCreateUserMutation } = usersApi;
```

---

## Usage Examples

### 1. Fetching Data

```tsx
import { useGetProductsQuery } from '@/store/api/productsApi';

function ProductList() {
  const { data, isLoading, error } = useGetProductsQuery({
    page: 1,
    limit: 10,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {getErrorMessage(error)}</div>;

  return (
    <div>
      {data?.products.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### 2. Creating Data

```tsx
import { useCreateProductMutation } from '@/store/api/productsApi';

function CreateProduct() {
  const [createProduct, { isLoading }] = useCreateProductMutation();

  const handleSubmit = async (formData) => {
    try {
      await createProduct(formData).unwrap();
      toast.success('Product created!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 3. Updating Data

```tsx
import { useUpdateProductMutation } from '@/store/api/productsApi';

function EditProduct({ productId }) {
  const [updateProduct, { isLoading }] = useUpdateProductMutation();

  const handleUpdate = async (updates) => {
    try {
      await updateProduct({ id: productId, updates }).unwrap();
      toast.success('Product updated!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return <form onSubmit={handleUpdate}>...</form>;
}
```

### 4. Deleting Data

```tsx
import { useDeleteProductMutation } from '@/store/api/productsApi';

function DeleteButton({ productId }) {
  const [deleteProduct, { isLoading }] = useDeleteProductMutation();

  const handleDelete = async () => {
    try {
      await deleteProduct(productId).unwrap();
      toast.success('Product deleted!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <button onClick={handleDelete} disabled={isLoading}>
      Delete
    </button>
  );
}
```

### 5. Using Redux State

```tsx
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCurrentUser, logout } from '@/store/slices/authSlice';

function UserProfile() {
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div>
      <h1>{user?.name}</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

### 6. Lazy Queries (Manual Trigger)

```tsx
import { useLazySearchProductsQuery } from '@/store/api/productsApi';

function SearchProducts() {
  const [trigger, { data, isLoading }] = useLazySearchProductsQuery();

  const handleSearch = (searchTerm: string) => {
    trigger(searchTerm);
  };

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {isLoading && <div>Searching...</div>}
      {data?.map((product) => <div key={product.id}>{product.name}</div>)}
    </div>
  );
}
```

---

## Best Practices

### 1. **Use Typed Hooks**
Always use the typed hooks from `store/hooks.ts`:
```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
```

### 2. **Handle Errors Properly**
Use the error utility function:
```typescript
import { getErrorMessage } from '@/store/api/utils';

if (error) {
  const message = getErrorMessage(error);
  toast.error(message);
}
```

### 3. **Use Tags for Cache Invalidation**
```typescript
providesTags: (result) =>
  result
    ? [...result.map(({ id }) => ({ type: 'Product' as const, id }))]
    : [{ type: 'Product', id: 'LIST' }],

invalidatesTags: [{ type: 'Product', id: 'LIST' }],
```

### 4. **Implement Optimistic Updates**
For better UX, update the UI immediately:
```typescript
async onQueryStarted(newProduct, { dispatch, queryFulfilled }) {
  const patchResult = dispatch(
    productsApi.util.updateQueryData('getProducts', undefined, (draft) => {
      draft.products.unshift(newProduct);
    })
  );
  try {
    await queryFulfilled;
  } catch {
    patchResult.undo();
  }
}
```

### 5. **Configure Cache TTL**
Set appropriate cache times:
```typescript
keepUnusedDataFor: 300, // 5 minutes
```

### 6. **Use Query Parameters**
Build clean query strings:
```typescript
import { buildQueryString } from '@/store/api/utils';

query: (params) => `/products${buildQueryString(params)}`,
```

---

## Advanced Features

### 1. **Polling**
Auto-refresh data at intervals:
```typescript
const { data } = useGetProductsQuery(undefined, {
  pollingInterval: 30000, // Poll every 30 seconds
});
```

### 2. **Skip Queries**
Conditionally skip queries:
```typescript
const { data } = useGetProductByIdQuery(productId, {
  skip: !productId,
});
```

### 3. **Prefetching**
Prefetch data before navigation:
```typescript
const dispatch = useAppDispatch();

const handleMouseEnter = () => {
  dispatch(productsApi.util.prefetch('getProductById', productId, { force: true }));
};
```

### 4. **Manual Cache Updates**
Update cache manually:
```typescript
dispatch(
  productsApi.util.updateQueryData('getProducts', undefined, (draft) => {
    draft.products.push(newProduct);
  })
);
```

### 5. **Reset API State**
Clear all cache:
```typescript
dispatch(apiSlice.util.resetApiState());
```

### 6. **Selective Invalidation**
Invalidate specific cache entries:
```typescript
dispatch(
  productsApi.util.invalidateTags([{ type: 'Product', id: productId }])
);
```

---

## Configuration Options

### API Base URL
Set in `.env`:
```env
VITE_API_BASE_URL=https://api.example.com
```

### Retry Configuration
Modify in `apiSlice.ts`:
```typescript
const baseQueryWithRetry = retry(baseQuery, { maxRetries: 3 });
```

### Cache Configuration
Adjust in `config.ts`:
```typescript
export const CACHE_CONFIG = {
  DEFAULT_TTL: 60,
  LONG_TTL: 300,
  SHORT_TTL: 30,
};
```

---

## Troubleshooting

### Issue: "Cannot find module '@/store'"
**Solution:** Check your `tsconfig.json` path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: Token not being sent
**Solution:** Ensure token is in state or localStorage:
```typescript
const token = (getState() as RootState).auth.token || localStorage.getItem('token');
```

### Issue: Cache not invalidating
**Solution:** Check tag types are defined in `apiSlice.ts`:
```typescript
tagTypes: ['User', 'Product', ...],
```

---

## Migration from Context API

If you're migrating from Context API (like AuthContext):

1. **Keep existing context for backward compatibility**
2. **Gradually migrate to Redux hooks**
3. **Use both during transition:**

```tsx
// Old way (Context)
const { user } = useAuth();

// New way (Redux)
const user = useAppSelector(selectCurrentUser);
```

---

## Support

For more information:
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [RTK Query Docs](https://redux-toolkit.js.org/rtk-query/overview)
- [TypeScript Guide](https://redux-toolkit.js.org/usage/usage-with-typescript)

---

**Happy Coding! 🚀**
