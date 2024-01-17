export type FlagResponse = {
  UPRN: string;
  TOID?: string;
  ParentTOID?: string;
  Flagged: string;
  FlagDate: string;
};

export type FlagMap = {
  [key: string]: FlagResponse[];
};
