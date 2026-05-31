import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Factory that generates standard CRUD hooks for a resource.
 *
 * @param {string} queryKey - React Query cache key (e.g. 'sessions')
 * @param {{ getList, getOne, create, update, remove }} service - service functions
 * @param {{ listOptions, confirmMessage }} options
 *   - listOptions: extra useQuery options applied to useList (e.g. { staleTime: 30_000 })
 *   - confirmMessage: confirmation text shown before deletion in useDeleteWithConfirm
 * @returns {{ useList, useOne, useCreate, useUpdate, useDelete, useDeleteWithConfirm }}
 */
export function createResourceHooks(queryKey, service, { listOptions = {}, confirmMessage } = {}) {
  function useList(page = 1, perPage = 50, options = {}) {
    return useQuery({
      queryKey: [queryKey, page, perPage, options],
      queryFn: () => service.getList(page, perPage, options),
      placeholderData: (prev) => prev,
      ...listOptions,
    });
  }

  function useOne(id, options = {}) {
    return useQuery({
      queryKey: [queryKey, id, options],
      queryFn: () => service.getOne(id, options),
      enabled: !!id,
    });
  }

  function useCreate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: service.create,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  function useUpdate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }) => service.update(id, data),
      onSuccess: (updated) => {
        queryClient.setQueryData([queryKey, updated.id], updated);
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  function useDelete() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: service.remove,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  function useDeleteWithConfirm() {
    const { mutateAsync } = useDelete();
    return useCallback(async (id) => {
      if (!window.confirm(confirmMessage)) return false;
      try {
        await mutateAsync(id);
        return true;
      } catch (e) {
        console.error(`Error deleting ${queryKey}:`, e);
        return false;
      }
    }, [mutateAsync]);
  }

  return { useList, useOne, useCreate, useUpdate, useDelete, useDeleteWithConfirm };
}
