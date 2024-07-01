/* eslint-disable prettier/prettier */
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { filterResponse, getErrorResponse, getFailedResponse, getImportFileContent, getSuccessResponse, handleResponse } from '../common/controllerFunctions';
import { CustomerInterface } from '../common/types/customerTypes';
import { parse } from 'csv-parse';
import { importFileRowValidate, isExist } from '../common/validations/requestBodyValidations';
import { insertCustomerToDB } from '../common/config/dbConfig';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

let hasValidationErrors = false;
let validationErrors: any[] = [];
let duplicationErrors: any[] = [];

const validateFields = (fileContent: CustomerInterface[]) => {
    hasValidationErrors = false;
    validationErrors = [];

    fileContent.forEach(element => {
        const validationResponse = importFileRowValidate(element);
        const errors = validationResponse.errors;
        if (!validationResponse.passed) {
            console.log('Invalid customer details');
            hasValidationErrors = true;
        }
        validationErrors.push({
            "customerID": element.customerID,
            "field-errors": errors.errors
        });
    });
}

const validateDuplications = async (fileContent: CustomerInterface[]): Promise<any[]> => {
    duplicationErrors = [];
    const validationPromises = fileContent.map(async (record) => {
        const duplicateCustomerID = await isExist('customerID', record.customerID);
        const duplicateEmail = await isExist('email', record.email);
        let hasduplicate: boolean;
        const errors: any[] = [];
        if ((duplicateCustomerID && Object.keys(duplicateCustomerID).length > 0)) {
            errors.push("Already existing customerID");
            if ((duplicateEmail && Object.keys(duplicateEmail).length > 0)) {
                errors.push("Already existing email");
                hasduplicate = true;
            }
            hasduplicate = true;
            duplicationErrors.push({
                "customerID": record.customerID,
                "errors": errors
            });
            return true;
        } else if ((duplicateEmail && Object.keys(duplicateEmail).length > 0)) {
            errors.push("Already existing email");
            hasduplicate = true;
            duplicationErrors.push({
                "customerID": record.customerID,
                "errors": errors
            });
            return true;
        } else {
            errors.push("");
        }
        duplicationErrors.push({
            "customerID": record.customerID,
            "errors": errors
        });
        return false;

    });

    try {
        const duplicateResult = await Promise.all(validationPromises);
        return duplicateResult;
    } catch (error: any) {
        console.log("validation errror....", error.message);
        throw new Error("Cannot perform validation");
    }

}


export const importCustomerFileController = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let fileName;
    // const bucketName = process.env.S3BUCKET_NAME
    console.log('\nGet request made to \\customers\\id : ', event);
    // const headers: string[] = [
    //     "customerID",
    //     "name",
    //     "email",
    //     "address",
    //     "tel",
    //     "country",
    //     "verifiedStatus"
    // ]

    try {
        if (event.pathParameters) {
            fileName = event.pathParameters.file;
            console.log('Filename: ', fileName);

            // const s3Client = new S3Client({});
            // const getFileCommand = new GetObjectCommand({
            //     Bucket: bucketName,
            //     Key: fileName,
            // })

            try {
                // const { Body } = await s3Client.send(getFileCommand);
                // const fileContent: string = (await Body?.transformToString()) as string;
                // console.log('File content : ', fileContent);

                // const parseFileContentPromise: Promise<CustomerInterface[]> = new Promise(
                //     (resolve, reject) => {
                //         parse(fileContent, {
                //             delimiter: ",",
                //             columns: headers,
                //             fromLine: 2,
                //         }, (error, result: CustomerInterface[]) => {
                //             if (error) {
                //                 console.error(error);
                //                 reject(error);
                //                 return;
                //             }
                //             resolve(result);
                //             return;
                //         });
                //     }
                // );

                // const fileRecords: CustomerInterface[] = (await parseFileContentPromise) as CustomerInterface[];
                const fileRecords: CustomerInterface[] = getImportFileContent(fileName);

                validateFields(fileRecords);
                console.log(validationErrors);

                try {
                    const duplicateResult = await validateDuplications(fileRecords);
                    console.log('Duplicated result : ', duplicateResult);

                    let rowCount = 0;
                    validationErrors.forEach(element => {
                        duplicationErrors.forEach(e => {
                            console.log(e.customerID);
                            if (e.customerID == element.customerID) {
                                element['duplication-errors'] = e.errors;
                            }
                        });
                        console.log(element);
                        rowCount++;
                    });

                    console.log(validationErrors);

                    if (hasValidationErrors) {
                        console.log('Encountered validation errors');
                        console.error('Invalid customer details provided');
                        const response: object = [{
                            "success": false,
                            "message": validationErrors
                        }]
                        return handleResponse(400, response);

                    } else {

                        try {
                            const savePromises = fileRecords.map(async (record) => {
                                const singleResult = await insertCustomerToDB(record);
                                // setCache(singleResult.customerID, singleResult);
                                return singleResult;
                            });

                            const result: CustomerInterface[] = await Promise.all(savePromises);

                            const resCustomers: any[] = [];
                            result.forEach(r => {
                                const data: object = filterResponse(r);
                                resCustomers.push(data);
                            });
                            console.log('Customer details stored successfully');

                            return handleResponse(201, getSuccessResponse(resCustomers));

                        } catch (err) {
                            console.log("error from db");
                            console.error(err);
                            return handleResponse(500, getErrorResponse(err));

                        }
                    }

                } catch (err) {
                    console.log(err);
                    return handleResponse(500, getFailedResponse('Database cannot be connected'));
                }

            } catch (err) {
                console.log('Error in retrieving file : ', err);
                return handleResponse(500, getErrorResponse(err));
            }

        } else {
            console.log('No filename specified in the request path');

            return handleResponse(400, getFailedResponse('No filename specified in the request path'));
        }

    } catch (err) {
        console.log(err);
        return handleResponse(500, getErrorResponse(err));
    }
};