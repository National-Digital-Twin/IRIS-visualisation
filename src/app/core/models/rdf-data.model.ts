export interface TableRow {
    [key: string]: string;
}

export interface RDFObject {
    type: string;
    value: string;
}

export interface RDFData {
    [key: string]: RDFObject;
}

export interface SPARQLReturn {
    head: {
        vars: string[];
    };
    results: {
        bindings: RDFData[];
    };
}
