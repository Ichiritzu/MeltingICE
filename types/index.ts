/**
 * MeltingICE.app - TypeScript Type Definitions
 * Re-exports from indexedDb for convenience
 */

export type {
    IncidentStatus,
    AgencyType,
    AttachmentType,
    ReportTag,
    LocationData,
    Witness,
    AttachmentMeta,
    Incident,
    AttachmentData,
    AppSettings,
} from '@/lib/db/indexedDb';

export type { PublicReport, Resource, ReportsListResponse } from '@/lib/api';
export type { SanitizedReport } from '@/lib/sanitize';
