export interface ResultsCard {
    name: string;
    Address: string;
    SAPBand: string;
    PropertyType: string;
    flagged: boolean;
    dwellings?: ResultsCard[];
}
