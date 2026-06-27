export type Department = "OPEN_TRANSPORT" | "STUK_GOED" | (string & {});

export type FieldRequirement =
  | "REQUIRED"
  | "RECOMMENDED"
  | "OPTIONAL"
  | (string & {});

export type OrderStatus =
  | "EMAIL_RECEIVED"
  | "PROCESSING"
  | "AI_PROCESSING"
  | "NEW_ORDER"
  | "MODIFICATION_DETECTED"
  | "MISSING_INFORMATION"
  | "WAITING_CUSTOMER_RESPONSE"
  | "READY_TO_XML"
  | "XML_GENERATED"
  | "SENT_TO_CREATIVE_GEARS"
  | "CREATIVE_GEARS_ACCEPTED"
  | "CREATIVE_GEARS_REJECTED"
  | "MANUAL_REVIEW"
  | "FAILED"
  | (string & {});

export type EmailStatus =
  | "RECEIVED"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED"
  | (string & {});

export type OrderType =
  | "NEW_ORDER"
  | "MODIFICATION"
  | "UNKNOWN"
  | (string & {});

export type XmlDeliveryStatus =
  | "PENDING"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "FAILED"
  | (string & {});

export type IsoDateTimeString = string;

export type CustomerReplyDraftStatus =
  | "DRAFT"
  | "SENT"
  | "CANCELLED"
  | (string & {});

export type CustomerReplyDraft = {
  id: string;
  orderId: string;
  aiRequestId?: string | null;
  toEmail: string;
  subject: string;
  body: string;
  status: CustomerReplyDraftStatus;
  sentAt?: IsoDateTimeString | null;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};

export type Mailbox = {
  id: string;
  email: string;
  department: Department;
  active: boolean;
  lastSyncedAt: IsoDateTimeString | null;
  graphConnected?: boolean;
  graphConnectedEmail?: string | null;
  graphDisplayName?: string | null;
  graphTenantId?: string | null;
  graphTokenExpiresAt?: IsoDateTimeString | null;
  graphHasRefreshToken?: boolean;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};

export type MailboxMutationInput = {
  email?: string;
  department?: Department;
  active?: boolean;
};

export type DeleteMailboxResponse = {
  ok: boolean;
  deletedMailboxId: string;
  deletedMailboxEmail: string;
  deletedEmailsCount: number;
  deletedOrdersCount: number;
};

export type Attachment = {
  id: string;
  emailMessageId: string;
  graphAttachmentId: string;
  fileName: string;
  mimeType: string;
  size: number;
  contentBase64?: string | null;
  extractedText?: string | null;
  extractionMethod?: string | null;
  extractionStatus?:
    | "PENDING"
    | "SUCCESS"
    | "FAILED"
    | "OCR_REQUIRED"
    | (string & {})
    | null;
  downloadUrl?: string | null;
  createdAt?: IsoDateTimeString;
};

// GET /emails
export type EmailMessageListItem = {
  id: string;
  providerMessageId: string;
  graphMessageId?: string;
  conversationId?: string | null;
  threadKey?: string | null;
  fromEmail: string;
  fromName?: string | null;
  subject: string;
  bodyText?: string | null;
  receivedAt: IsoDateTimeString;
  hasAttachments?: boolean;
  status: EmailStatus;
  isTransportOrder?: boolean | null;
  classificationReason?: string | null;
  classifiedAt?: IsoDateTimeString | null;
  mailbox: Pick<
    Mailbox,
    "id" | "email" | "department" | "active" | "lastSyncedAt"
  >;
  attachments?: Attachment[];
};

// GET /emails/:id
export type EmailMessage = {
  id: string;
  providerMessageId: string;
  graphMessageId?: string;
  conversationId?: string;
  fromEmail: string;
  fromName?: string;
  subject: string;
  bodyText: string | null;
  bodyHtml?: string | null;
  receivedAt: IsoDateTimeString;
  hasAttachments: boolean;
  status: EmailStatus;
  isTransportOrder?: boolean | null;
  classificationReason?: string | null;
  classificationLanguage?: string | null;
  classifiedAt?: IsoDateTimeString | null;
  mailbox: Mailbox;
  attachments: Attachment[];
  order: Pick<
    TransportOrder,
    | "id"
    | "status"
    | "department"
    | "type"
    | "overallConfidence"
    | "createdAt"
    | "updatedAt"
  > | null;
  // Set when one email produced several orders (batch / weekly list).
  batch?: BatchImportSummary | null;
  orders?: BatchOrderItem[];
};

export type BatchImportSummary = {
  id: string;
  status: string;
  totalDetected: number;
  totalCreated: number;
  totalFailed: number;
  reason: string | null;
};

export type BatchOrderItem = {
  id: string;
  status: OrderStatus;
  externalReference: string | null;
  batchSequence: number | null;
};

// GET /orders
export type TransportOrderListItem = {
  id: string;
  status: OrderStatus;
  department: Department;
  type: OrderType;
  customerEmail: string;
  overallConfidence: number | null;
  createdAt: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
  emailMessageId?: string;
  missingFieldsCount?: number;
  batchImportId?: string | null;
  batchSequence?: number | null;
  externalReference?: string | null;
  lastAudit?: { action: string; createdAt: IsoDateTimeString } | null;
};

export type OrderField = {
  id: string;
  orderId: string;
  key: string;
  label: string;
  value: string | null;
  source?: string | null;
  required: boolean;
  requirement: FieldRequirement;
  missing: boolean;
  confidence: number | null;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type MissingField = {
  id: string;
  orderId: string;
  key: string;
  label: string;
  requirement: FieldRequirement;
  reason: string | null;
  createdAt: IsoDateTimeString;
};

export type ValidationWarning = {
  id: string;
  orderId: string;
  key: string;
  label: string;
  requirement: FieldRequirement;
  reason: string | null;
  createdAt: IsoDateTimeString;
};

export type AiRequest = {
  id: string;
  orderId: string;
  type?: "PROCESSING" | "REPLY" | (string & {});
  payloadJson: unknown;
  responseJson: unknown | null;
  status: string;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type AiExtractionSummary = {
  status: "COMPLETED" | "FAILED" | "SKIPPED" | "PENDING" | (string & {});
  date: IsoDateTimeString | null;
  reason: string | null;
};

export type XmlDelivery = {
  id: string;
  orderId: string;
  xmlPayload: string;
  status: XmlDeliveryStatus;
  requestPayload: string | null;
  responsePayload: string | null;
  errorMessage: string | null;
  sentAt: IsoDateTimeString | null;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

// GET /orders/:id
export type TransportOrder = {
  id: string;
  emailMessageId: string;
  department: Department;
  type: OrderType;
  status: OrderStatus;
  customerEmail: string;
  customerName: string | null;
  originalOrderReference: string | null;
  overallConfidence: number | null;
  createdAt: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
  fields: OrderField[];
  missingFields: MissingField[];
  validationWarnings: ValidationWarning[];
  aiRequests: AiRequest[];
  aiExtraction?: AiExtractionSummary;
  xmlDeliveries: XmlDelivery[];
};

export type TransportOrderDetailResponse = {
  order: Partial<
    Omit<
      TransportOrder,
      "fields" | "missingFields" | "aiRequests" | "xmlDeliveries"
    >
  >;
  fields: OrderField[];
  missingFields: MissingField[];
  validationWarnings: ValidationWarning[];
  email?: EmailMessage | null;
  aiRequests: AiRequest[];
  xmlDeliveries: XmlDelivery[];
};

export type EnqueuedResponse = { enqueued: true };

// POST /mailboxes/:id/sync
export type MailboxSyncResponse = {
  provider: string;
  imported: number;
  skipped: number;
  emails: Array<{
    emailMessageId: string;
    providerMessageId: string;
  }>;
};

export type DeleteEmailResponse = {
  ok: boolean;
  deletedEmailId: string;
  deletedOrderId: string | null;
  deletedReplyEmailsCount: number;
};

export type MicrosoftConnectionStatusResponse = {
  connected: boolean;
  email: string | null;
  displayName: string | null;
  expiresAt: IsoDateTimeString | null;
  tenantId: string | null;
  hasRefreshToken: boolean;
};

export type HealthResponse = {
  status: string;
  config?: {
    mailProvider?: "imap" | "graph";
    imap?: {
      host: string | null;
      user: string | null;
      configured: boolean;
    };
    creativeGears?: {
      endpointConfigured: boolean;
    };
    ai?: {
      apiConfigured: boolean;
    };
  };
};
