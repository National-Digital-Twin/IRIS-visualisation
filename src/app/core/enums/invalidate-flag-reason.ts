export enum InvalidateFlagReason {
  AssessThatMeasuresAreImplemented = 'Measures Implemented',
  AssessPropertyNotToBeEligible = ' Not eligible - property',
  AccessOccupantNotToBeEligible = ' Not eligible - occupant',
  AssessOccupantOptOutOrRefusal = 'Occupant opt-out',
  AccessToHaveSecuredAlternativeFunding = 'Occupant refusal - alternative funding secured',
  AssessToBeDuplicate = 'Duplicate flag',
  AssessToBeManualError = 'Manual error',
  AssessToBeComplianceIssue = 'Compliance issues',
}
