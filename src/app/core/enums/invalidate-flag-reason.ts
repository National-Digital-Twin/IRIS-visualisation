export enum InvalidateFlagReason {
  AssessThatMeasuresAreImplemented = 'Measures Implemented',
  AssessPropertyNotToBeEligible = ' Not eligible - property',
  AssessOccupantNotToBeEligible = ' Not eligible - occupant',
  AssessOccupantOptOutOrRefusal = 'Occupant opt-out',
  AssessToHaveSecuredAlternativeFunding = 'Occupant refusal - alternative funding secured',
  AssessToBeDuplicate = 'Duplicate flag',
  AssessToBeManualError = 'Manual error',
  AssessToBeComplianceIssue = 'Compliance issues',
}
