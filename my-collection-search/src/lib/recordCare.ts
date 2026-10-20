/**
 * The vocabulary of physical-copy care (#262), defined in @groovenet/contracts
 * and re-exported for the repositories, the service and the UI. The sleeve and
 * action lists mirror the CHECK constraints in
 * `migrations/1790726400000_add-record-copies-and-actions.js`; widening one
 * means a migration too.
 */
import type { SleeveType } from "@groovenet/contracts";

export {
  CLEANING_METHODS,
  RECORD_ACTION_TYPES,
  RECORD_CARE_STATUSES,
  SLEEVE_TYPES,
} from "@groovenet/contracts";
export type {
  CleaningMethod,
  RecordActionType,
  RecordCareStatus,
  SleeveType,
} from "@groovenet/contracts";

/** The sleeve a copy is assumed to want when a care query names none. */
export const DEFAULT_TARGET_SLEEVE: SleeveType = "poly-rice-paper-poly";

const DEFAULT_OVERDUE_DAYS = 365;

/**
 * Days since its last cleaning before a copy counts as overdue, when a request
 * does not say. `RECORD_CLEANING_OVERDUE_DAYS`, read on every call so a change
 * needs no rebuild.
 */
export function defaultOverdueDays(): number {
  const days = Number(process.env.RECORD_CLEANING_OVERDUE_DAYS);
  return Number.isInteger(days) && days > 0 ? days : DEFAULT_OVERDUE_DAYS;
}
