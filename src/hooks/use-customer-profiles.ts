'use client';

import {useQuery} from '@tanstack/react-query';
import {ApiError, getCustomerProfileFieldCatalog, getCustomerProfiles} from '@/lib/api';
import type {CustomerProfile, CustomerProfileCatalogField} from '@/types';

export function useCustomerProfiles() {
  return useQuery<CustomerProfile[], ApiError>({
    queryKey: ['customer-profiles'],
    queryFn: getCustomerProfiles
  });
}

export function useCustomerProfileFieldCatalog() {
  return useQuery<CustomerProfileCatalogField[], ApiError>({
    queryKey: ['customer-profile-field-catalog'],
    queryFn: getCustomerProfileFieldCatalog
  });
}
