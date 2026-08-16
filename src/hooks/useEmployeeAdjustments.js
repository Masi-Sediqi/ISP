import { useJsonCollection } from "./useJsonCollection";

// Employee adjustments are now Supabase-only.
export function useEmployeeAdjustments(options = {}) {
  return useJsonCollection("employeeAdjustments", options);
}
