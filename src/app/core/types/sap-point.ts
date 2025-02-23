export type SAPPoint = {
    UPRN: string;
    TOID?: string;
    SAPPoint: string;
    ParentTOID?: string;
    longitude: string;
    latitude: string;
};

export type SAPPointMap = {
    [key: string]: SAPPoint[];
};
