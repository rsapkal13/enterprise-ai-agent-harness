export interface UiManifest {
  id: string;
  name: string;
  journeyId: string;
  surfaces: UiSurface[];
}

export interface UiSurface {
  id: string;
  type: "confirmation" | "approval" | "status" | "review";
  title: string;
  fields: string[];
}

// TODO: Add richer component and interaction contracts.
