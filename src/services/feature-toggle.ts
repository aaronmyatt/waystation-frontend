export class FeatureToggleService {
  private features: Record<string, boolean> = {
    "settings-modal": true,
    "llm-generation": true,
    "flow-visibility-form": true,
  };

  constructor() {
    // initialize from window global if available
    if (globalThis.__INITIAL_DATA__?.features) {
      this.features = {
        ...this.features,
        ...globalThis.__INITIAL_DATA__.features,
      };
    }
  }


  isEnabled(featureName: string): boolean {
    return !!this.features[featureName];
  }

  setFeature(featureName: string, isEnabled: boolean) {
    this.features[featureName] = isEnabled;
  }
}