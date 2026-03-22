'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { credentialsApi } from '../lib/api';

export function useCredentials() {
  return useQuery({
    queryKey: ['credentials'],
    queryFn: () => credentialsApi.getAll().then((r) => r.data),
  });
}

export function useRequestCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: credentialsApi.request,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credentials'] }),
  });
}

export function useDeleteCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (credentialId: string) => credentialsApi.delete(credentialId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credentials'] }),
  });
}
