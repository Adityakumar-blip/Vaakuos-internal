import { apiSlice } from './apiSlice';
import { unwrapList } from './unwrapList';

export interface Conversation {
  id: string;
  tenant_id: string;
  contact_id: string;
  channel: 'whatsapp' | 'instagram' | 'messenger' | 'threads';
  external_id: string;
  last_message_at: string;
  last_message_body: string;
  unread_count: number;
  status: 'open' | 'closed' | 'snoozed';
  assigned_to?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
    profile?: any;
  };
  metadata: any;
  contacts: {
    id: string;
    phone_number: string;
    name: string;
    tags?: {
      tags: {
        id: string;
        name: string;
        color?: string;
      }
    }[];
  };
}

export interface Message {
  id: string;
  tenant_id: string;
  contact_id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  type: string;
  body: string;
  status: string;
  wa_message_id?: string;
  raw_payload?: any;
  is_internal: boolean;
  sender?: {
    id: string;
    name: string;
  };
  created_at: string;
}

export interface Note {
  id: string;
  conversation_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
  };
}

export const inboxApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query<Conversation[], void>({
      query: () => '/inbox/conversations',
      transformResponse: unwrapList<Conversation>,
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Conversation' as const, id })),
            { type: 'Conversation', id: 'LIST' },
          ]
          : [{ type: 'Conversation', id: 'LIST' }],
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch, getState }
      ) {
        // Wait for the initial query to resolve
        await cacheDataLoaded;

        const { io } = await import('socket.io-client');
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

        // Connect to the WebSocket gateway using only secure HttpOnly Cookies sent natively.
        // forceNew: each slice owns an isolated socket — without it socket.io reuses one
        // shared connection across slices, so any slice's disconnect() kills inbox realtime.
        const socket = io(baseUrl, {
          withCredentials: true,
          transports: ['websocket'],
          forceNew: true,
        });

        socket.on('connect', () => {
          console.log('Connected to Realtime WebSocket');
        });

        socket.on('NEW_MESSAGE', (data) => {
          try {
            console.log('New message received:', data);
            
            // Optimistically update the message list for the conversation
            dispatch(
              inboxApi.util.updateQueryData('getConversationMessages', data.conversationId, (draft) => {
                if (data.message && !draft.some(m => m.id === data.message.id)) {
                  draft.push(data.message);
                }
              })
            );

            // Optimistically update the conversation list directly
            dispatch(
              inboxApi.util.updateQueryData('getConversations', undefined, (draft) => {
                const conv = draft.find(c => c.id === data.conversationId);
                if (conv && data.message) {
                  conv.last_message_at = data.message.created_at;
                  conv.last_message_body = data.message.body;
                  // If it's incoming, increment unread locally
                  if (data.message.direction === 'inbound') {
                    conv.unread_count = (conv.unread_count || 0) + 1;
                  }
                  // Move this conversation to the top
                  const convIndex = draft.findIndex(c => c.id === data.conversationId);
                  if (convIndex > 0) {
                    draft.splice(convIndex, 1);
                    draft.unshift(conv);
                  }
                }
              })
            );

            // Keep invalidateTags as fallback and to sync any server-side changes
            dispatch(
              inboxApi.util.invalidateTags([
                { type: 'Conversation', id: 'LIST' },
                { type: 'Message', id: `LIST_${data.conversationId}` },
                { type: 'Conversation', id: data.conversationId },
              ])
            );
          } catch (err) {
            console.error('Error handling WebSocket message', err);
          }
        });

        socket.on('error', (err) => {
          console.error('WebSocket Error', err);
        });

        // Clean up socket when the cache entry is removed
        await cacheEntryRemoved;
        socket.disconnect();
      },
    }),
    getConversationMessages: builder.query<Message[], string>({
      query: (id) => `/inbox/conversations/${id}/messages`,
      providesTags: (result, error, id) => [{ type: 'Message', id: `LIST_${id}` }],
    }),
    sendReply: builder.mutation<Message, { conversationId: string; body: string }>({
      query: ({ conversationId, body }) => ({
        url: `/inbox/conversations/${conversationId}/reply`,
        method: 'POST',
        body: { body },
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Message', id: `LIST_${conversationId}` },
        { type: 'Conversation', id: conversationId },
      ],
    }),
    assignConversation: builder.mutation<void, { conversationId: string; userId: string }>({
      query: ({ conversationId, userId }) => ({
        url: `/inbox/conversations/${conversationId}/assign`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Conversation', id: 'LIST' },
        { type: 'Conversation', id: conversationId },
      ],
    }),
    updateConversationStatus: builder.mutation<Conversation, { conversationId: string; status: Conversation['status'] }>({
      query: ({ conversationId, status }) => ({
        url: `/inbox/conversations/${conversationId}/status`,
        method: 'POST',
        body: { status },
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Conversation', id: 'LIST' },
        { type: 'Conversation', id: conversationId },
      ],
    }),
    sendMedia: builder.mutation<Message, { conversationId: string; mediaType: string; mediaUrl: string; caption?: string; filename?: string }>({
      query: ({ conversationId, ...body }) => ({
        url: `/inbox/conversations/${conversationId}/media`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Message', id: `LIST_${conversationId}` },
        { type: 'Conversation', id: conversationId },
      ],
    }),
    getNotes: builder.query<Note[], string>({
      query: (id) => `/inbox/conversations/${id}/notes`,
      providesTags: (result, error, id) => [{ type: 'Note', id: `LIST_${id}` }],
    }),
    createNote: builder.mutation<Note, { conversationId: string; body: string }>({
      query: ({ conversationId, body }) => ({
        url: `/inbox/conversations/${conversationId}/notes`,
        method: 'POST',
        body: { body },
      }),
      invalidatesTags: (result, error, { conversationId }) => [{ type: 'Note', id: `LIST_${conversationId}` }],
    }),
    updateNote: builder.mutation<Note, { noteId: string; body: string; conversationId: string }>({
      query: ({ noteId, body }) => ({
        url: `/inbox/notes/${noteId}`,
        method: 'POST',
        body: { body },
      }),
      invalidatesTags: (result, error, { conversationId }) => [{ type: 'Note', id: `LIST_${conversationId}` }],
    }),
    deleteNote: builder.mutation<void, { noteId: string; conversationId: string }>({
      query: ({ noteId }) => ({
        url: `/inbox/notes/${noteId}/delete`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { conversationId }) => [{ type: 'Note', id: `LIST_${conversationId}` }],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationMessagesQuery,
  useSendReplyMutation,
  useAssignConversationMutation,
  useUpdateConversationStatusMutation,
  useSendMediaMutation,
  useGetNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = inboxApi;
