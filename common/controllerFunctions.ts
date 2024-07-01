/* eslint-disable prettier/prettier */
import { CustomerInterface } from "./types/customerTypes";

export let importFileContent: CustomerInterface[] = [];

export const setImportFileContent = (fileRecords: CustomerInterface[]) => {
    importFileContent = fileRecords;
}

export const getImportFileContent = (fileName: string | undefined): CustomerInterface[] => {

    let content: CustomerInterface[] = [];

    if (fileName === 'sample.csv') {
        content = [
            {
                "customerID": "A0001",
                "name": "John",
                "email": "john@email.com",
                "address": "No 13, 1st lane, Highland, UK",
                "tel": "1234546782",
                "country": "UK",
                "verifiedStatus": true
            } as CustomerInterface,
            {
                "customerID": "B0912",
                "name": "Bruce Lee",
                "email": "bruce-lee@mail.com",
                "address": "No 54, Giver lane, Parkview, UK",
                "tel": "1234540782",
                "country": "UK",
                "verifiedStatus": true
            } as CustomerInterface,
            {
                "customerID": "B9012",
                "name": "Nisha Light",
                "email": "light-nis@mail.com",
                "address": "No 152, Gandhi road, Madras, India",
                "tel": "1234511782",
                "country": "India",
                "verifiedStatus": true
            } as CustomerInterface,
            {
                "customerID": "D2310",
                "name": "Thushari",
                "email": "thush@mail.com",
                "address": "No 12, Neru road, Colombo, LK",
                "tel": "0774540782",
                "country": "LK",
                "verifiedStatus": true
            } as CustomerInterface,
            {
                "customerID": "A0002",
                "name": "Harith",
                "email": "har@email.com",
                "address": "No 2, 2nd lane, Righta, USA",
                "tel": "2341567261",
                "country": "USA",
                "verifiedStatus": false
            } as CustomerInterface
        ]

    } else if (fileName === 'sample2.csv') {
        content = [
            {
                "customerID": "A00012",
                "name": "John",
                "email": "john@email.com",
                "address": "No 13, 1st lane, Highland, UK",
                "tel": "1234546782",
                "country": "UK",
                "verifiedStatus": true
            } as CustomerInterface,
            {
                "customerID": "B0912",
                "name": "Bruce Lee",
                "email": "bruce-lee:mail.com",
                "address": "No 54, Giver lane, Parkview, UK",
                "tel": "1234540782",
                "country": "UK",
                "verifiedStatus": true
            } as CustomerInterface
        ]

    } else {
        content = [];
    }

    return content;
}

export const getErrorResponse = (err: unknown): object => {
    const error: Error = <Error>err;
    const response: object = {
        success: false,
        message: error.message
    }
    return response;
}

export const getFailedResponse = (msg: string): object => {
    const response: object = {
        success: false,
        message: msg
    }
    return response;
}

export const getSuccessResponse = (data: unknown): object => {
    const response: object = {
        success: true,
        data: data
    }
    return response;
}

export const handleInvalidCustomerId = (customerID: string) => {
    console.log('Invalid customer id')
    return {
        statusCode: 400,
        body: JSON.stringify({
            success: false,
            message: `Invalid customerID passed : ${customerID}`,
        }),
    };
}

export const handleResponse = (statusCode: number, response: object) => {
    return {
        statusCode: statusCode,
        body: JSON.stringify(response),
    };
}

export function filterResponse(dbResult: any): object {
    const response: object = {
        customerID: dbResult.customerID,
        name: dbResult.name,
        email: dbResult.email,
        tel: dbResult.tel,
        address: dbResult.address,
        country: dbResult.country,
        verifiedStatus: dbResult.verifiedStatus
    }
    return response;
}