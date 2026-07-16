import {apiClient} from './api-client';
import type {
  CustomerProfile,
  CustomerProfileCatalogField,
  CustomerProfileMutationInput,
  DeleteCustomerProfileResponse
} from '@/types';

export async function getCustomerProfiles() {
  const {data} = await apiClient.get<CustomerProfile[]>('/customer-profiles');
  return data;
}

export async function getCustomerProfileFieldCatalog() {
  const {data} = await apiClient.get<CustomerProfileCatalogField[]>('/customer-profiles/field-catalog');
  return data;
}

export async function createCustomerProfile(payload: CustomerProfileMutationInput) {
  const {data} = await apiClient.post<CustomerProfile>('/customer-profiles', payload);
  return data;
}

export async function updateCustomerProfile(
  customerProfileId: string,
  payload: CustomerProfileMutationInput
) {
  const {data} = await apiClient.patch<CustomerProfile>(`/customer-profiles/${customerProfileId}`, payload);
  return data;
}

export async function deleteCustomerProfile(customerProfileId: string) {
  const {data} = await apiClient.delete<DeleteCustomerProfileResponse>(`/customer-profiles/${customerProfileId}`);
  return data;
}
