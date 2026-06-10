import {apiClient} from './api-client';
import type {DeleteMailboxResponse, Mailbox, MailboxMutationInput, MailboxSyncResponse} from '@/types';

export async function getMailboxes() {
  const {data} = await apiClient.get<Mailbox[]>('/mailboxes');
  return data;
}

export async function syncMailbox(mailboxId: string) {
  // Backend controller is `POST /mailboxes/:id/sync`
  const {data} = await apiClient.post<MailboxSyncResponse>(`/mailboxes/${mailboxId}/sync`);
  return data;
}

export async function createMailbox(payload: MailboxMutationInput) {
  const {data} = await apiClient.post<Mailbox>('/mailboxes', payload);
  return data;
}

export async function updateMailbox(mailboxId: string, payload: MailboxMutationInput) {
  const {data} = await apiClient.patch<Mailbox>(`/mailboxes/${mailboxId}`, payload);
  return data;
}

export async function deleteMailbox(mailboxId: string) {
  const {data} = await apiClient.delete<DeleteMailboxResponse>(`/mailboxes/${mailboxId}`);
  return data;
}
