import { apiSlice } from './apiSlice';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'alert';

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnreadCountResponse {
  count?: number;
  // backend returns a plain number via prisma.count()
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    /** GET /notifications?is_read=true|false */
    getNotifications: builder.query<Notification[], { isRead?: boolean } | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args && args.isRead !== undefined) {
          params.set('is_read', String(args.isRead));
        }
        const qs = params.toString();
        return `/notifications${qs ? `?${qs}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Notification' as const, id })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],

      // ── WebSocket subscription ──────────────────────────────────────────
      async onCacheEntryAdded(
        _arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch, getState }
      ) {
        await cacheDataLoaded;

        const { io } = await import('socket.io-client');
        const token =
          (getState() as { auth?: { token?: string | null } }).auth?.token || undefined;
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

        const socket = io(baseUrl, {
          withCredentials: true, // send the auth cookie on the WS handshake
          auth: token ? { token } : undefined, // out-of-band, never in the URL
          transports: ['websocket'],
          forceNew: true, // isolate this socket so a sibling slice's disconnect() can't kill it
        });

        socket.on('NOTIFICATION_NEW', (notification: Notification) => {
          // Update the notifications list cache
          dispatch(
            notificationsApi.util.updateQueryData('getNotifications', undefined, (draft) => {
              const exists = draft.some((n) => n.id === notification.id);
              if (!exists) {
                draft.unshift(notification);
              }
            })
          );

          // Real-time update to unread count
          dispatch(
            notificationsApi.util.updateQueryData('getUnreadCount', undefined, (count) => {
              if (typeof count === 'number') return count + 1;
              return count;
            })
          );
        });

        await cacheEntryRemoved;
        socket.disconnect();
      },
    }),

    /** GET /notifications/unread-count */
    getUnreadCount: builder.query<number, void>({
      query: () => '/notifications/unread-count',
      // Backend returns a plain count number from prisma.count()
      transformResponse: (res: number | { count: number }) =>
        typeof res === 'number' ? res : res.count ?? 0,
      providesTags: [{ type: 'Notification', id: 'UNREAD_COUNT' }],
      async onCacheEntryAdded(
        _arg,
        { cacheDataLoaded, cacheEntryRemoved, dispatch, getState }
      ) {
        await cacheDataLoaded;

        const { io } = await import('socket.io-client');
        const token =
          (getState() as { auth?: { token?: string | null } }).auth?.token || undefined;
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

        const socket = io(baseUrl, {
          withCredentials: true, // send the auth cookie on the WS handshake
          auth: token ? { token } : undefined, // out-of-band, never in the URL
          transports: ['websocket'],
          forceNew: true, // isolate this socket so a sibling slice's disconnect() can't kill it
        });

        socket.on('NOTIFICATION_NEW', (notification: Notification) => {
          // Update unread count
          dispatch(
            notificationsApi.util.updateQueryData('getUnreadCount', undefined, (count) => {
              if (typeof count === 'number') return count + 1;
              return count;
            })
          );
          
          // Also update the list if it happens to be in cache
          dispatch(
            notificationsApi.util.updateQueryData('getNotifications', undefined, (draft) => {
              if (!draft) return;
              const exists = draft.some((n) => n.id === notification.id);
              if (!exists) {
                draft.unshift(notification);
              }
            })
          );

          // ─── Trigger Native Browser Notification ───────────────────────
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(notification.title, {
                body: notification.message,
                icon: "/favicon.ico", // Attempt to use app icon
                tag: notification.id, // Grouping/Duplication prevention
              });
            } catch (err) {
              console.error("Browser notification failed:", err);
            }
          }
        });

        await cacheEntryRemoved;
        socket.disconnect();
      },
    }),

    /** PATCH /notifications/:id/read */
    markAsRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      // Optimistically update the cached list immediately
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          notificationsApi.util.updateQueryData('getNotifications', undefined, (draft) => {
            const n = draft.find((x) => x.id === id);
            if (n) n.is_read = true;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: [{ type: 'Notification', id: 'UNREAD_COUNT' }],
    }),

    /** PATCH /notifications/read-all */
    markAllAsRead: builder.mutation<void, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          notificationsApi.util.updateQueryData('getNotifications', undefined, (draft) => {
            draft.forEach((n) => { n.is_read = true; });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: [{ type: 'Notification', id: 'UNREAD_COUNT' }],
    }),

    /** DELETE /notifications/:id */
    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'UNREAD_COUNT' },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;
