'use client';

import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  ApiError,
  createCustomerProfile,
  deleteCustomerProfile,
  updateCustomerProfile
} from '@/lib/api';
import type {
  CustomerProfile,
  CustomerProfileMutationInput,
  DeleteCustomerProfileResponse
} from '@/types';

export function useCreateCustomerProfile() {
  const queryClient = useQueryClient();

  const mutation = useMutation<CustomerProfile, ApiError, CustomerProfileMutationInput>({
    mutationFn: (payload) => createCustomerProfile(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['customer-profiles']});
    }
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    error: mutation.error
  };
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    CustomerProfile,
    ApiError,
    {customerProfileId: string; payload: CustomerProfileMutationInput}
  >({
    mutationFn: ({customerProfileId, payload}) =>
      updateCustomerProfile(customerProfileId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['customer-profiles']});
    }
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    error: mutation.error
  };
}

export function useDeleteCustomerProfile() {
  const queryClient = useQueryClient();

  const mutation = useMutation<DeleteCustomerProfileResponse, ApiError, string>({
    mutationFn: (customerProfileId) => deleteCustomerProfile(customerProfileId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['customer-profiles']});
    }
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    error: mutation.error
  };
}
