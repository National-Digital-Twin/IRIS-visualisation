export type SAPPoint = {
  UPRN: string;
  TOID?: string;
  SAPPoint: string;
  ParentTOID?: string;
};

export type SAPPointMap = {
  [key: string]: SAPPoint[];
};
