import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile, ExternalBlob, StatusItem, MediaType, Message, Time } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

// Profile queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: (_, profile) => {
      // Update the cache immediately with the new profile
      queryClient.setQueryData(['currentUserProfile'], profile);
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Profile photo queries
export function useGetCallerProfilePhoto() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ExternalBlob | null>({
    queryKey: ['profilePhoto', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return actor.getUserProfilePhoto(identity.getPrincipal());
    },
    enabled: !!actor && !!identity && !actorFetching,
  });
}

export function useGetUserProfilePhoto(user: Principal) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ExternalBlob | null>({
    queryKey: ['profilePhoto', user.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserProfilePhoto(user);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSetCallerProfilePhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (photo: ExternalBlob | null) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setCallerProfilePhoto(photo);
    },
    onSuccess: () => {
      if (identity) {
        queryClient.invalidateQueries({
          queryKey: ['profilePhoto', identity.getPrincipal().toString()],
        });
      }
    },
  });
}

// Phone number update
export function useUpdatePhoneNumber() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phone: string | null) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updatePhoneNumber(phone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Contacts queries
export function useGetUserContacts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserContacts();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactPrincipalId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addContact(contactPrincipalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useAddContactByPhone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phone: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addContactByPhone(phone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useFindUserByPhoneNumber() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (phone: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.findUserByPhoneNumber(phone);
    },
  });
}

// Messaging queries - NEW: Persistent chat history
export function useGetConversationWithContact(contact: Principal) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Message[]>({
    queryKey: ['conversation', contact.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConversationWithContact(contact);
    },
    enabled: !!actor && !!identity && !actorFetching,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient, content }: { recipient: Principal; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.storePersistentMessage(recipient, content, null);
    },
    onSuccess: (_, { recipient }) => {
      // Invalidate conversation to refresh from backend
      queryClient.invalidateQueries({ queryKey: ['conversation', recipient.toString()] });
    },
  });
}

// Presence queries - NEW: Combined presence with last-seen
export interface UserPresenceData {
  isOnline: boolean;
  lastSeen: Time | null;
}

export function useGetUserPresence(user: Principal) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserPresenceData>({
    queryKey: ['presence', user.toString()],
    queryFn: async () => {
      if (!actor) return { isOnline: false, lastSeen: null };
      
      // Fetch all presence data
      const allPresence = await actor.getUserPresence();
      
      // Find the specific user's presence
      const userPresence = allPresence.find(([principal]) => principal.toString() === user.toString());
      
      if (!userPresence) {
        return { isOnline: false, lastSeen: null };
      }
      
      const [, [isOnline, lastSeenTime]] = userPresence;
      return {
        isOnline,
        lastSeen: lastSeenTime === BigInt(0) ? null : lastSeenTime,
      };
    },
    enabled: !!actor && !!identity && !actorFetching,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useSetUserPresence() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (isOnline: boolean) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setUserPresence(isOnline);
    },
  });
}

// Admin queries
export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

// User info queries
export function useGetUserBasicInfo(principal: Principal) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<[Principal, string] | null>({
    queryKey: ['userBasicInfo', principal.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserBasicInfo(principal);
    },
    enabled: !!actor && !actorFetching,
  });
}

// Status/Stories queries
export function useCreateStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      media,
      caption,
      audioTrack,
    }: {
      media: MediaType;
      caption: string;
      audioTrack?: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPublicStatus(media, caption, audioTrack || null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      queryClient.invalidateQueries({ queryKey: ['visibleStatuses'] });
    },
  });
}

export function useGetStatusesForUser(author: Principal) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<StatusItem[]>({
    queryKey: ['statuses', author.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStatusesForUser(author);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetVisibleStatuses() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<StatusItem[]>({
    queryKey: ['visibleStatuses'],
    queryFn: async () => {
      if (!actor || !identity) return [];

      try {
        // Get user's contacts
        const contacts = await actor.getUserContacts();

        // Fetch statuses for each contact (including self)
        const allStatuses: StatusItem[] = [];
        const uniqueAuthors = new Set([identity.getPrincipal().toString(), ...contacts.map((c) => c.toString())]);

        for (const authorStr of uniqueAuthors) {
          try {
            // Convert string back to Principal for the query
            const authorPrincipal = contacts.find((c) => c.toString() === authorStr) || identity.getPrincipal();
            const statuses = await actor.getStatusesForUser(authorPrincipal);
            allStatuses.push(...statuses);
          } catch (error) {
            // Skip if unauthorized or error fetching specific user's statuses
            console.warn(`Could not fetch statuses for ${authorStr}:`, error);
          }
        }

        // Sort by timestamp (newest first)
        return allStatuses.sort((a, b) => Number(b.timestamp - a.timestamp));
      } catch (error) {
        console.error('Error fetching visible statuses:', error);
        return [];
      }
    },
    enabled: !!actor && !!identity && !actorFetching,
  });
}

export function useDeleteStatusForAuthor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ author, statusId }: { author: Principal; statusId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteStatusForAuthor(author, statusId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      queryClient.invalidateQueries({ queryKey: ['visibleStatuses'] });
    },
  });
}
