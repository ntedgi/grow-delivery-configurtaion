export interface Variant {
  name: string
  traffic: number
}

export interface TargetingRule {
  type: string
  values: string[]
}

export interface Toggle {
  [key: string]: any
}

export interface SdkToggle {
  [key: string]: any
}

export interface Landing {
  landingID: number
  landingName: string
  enabled: boolean
  toggles: Toggle
  sdkToggles: SdkToggle
}

export interface Experiment extends Landing {
  userClusters?: number[]
}

export interface Filter {
  applicationIDs: number[]
  landings: Landing[]
}

export interface DefaultConfig {
  landingID: number
  landingName: string
  enabled: boolean
  toggles: {
    both?: Toggle
    ios?: Toggle
    android?: Toggle
  }
  sdkToggles: {
    both?: SdkToggle
    ios?: SdkToggle
    android?: SdkToggle
  }
}

export interface ExperimentsConfig {
  default: DefaultConfig
  experiments: Experiment[]
  filters: Filter[]
}
