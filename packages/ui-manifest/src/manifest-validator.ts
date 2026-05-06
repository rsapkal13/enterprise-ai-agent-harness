import type { UiManifest } from "./manifest-types";

export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateManifest(_manifest: UiManifest): ManifestValidationResult {
  // TODO: Validate against schemas/ui-manifest.schema.json.
  return {
    valid: true,
    errors: [],
  };
}
