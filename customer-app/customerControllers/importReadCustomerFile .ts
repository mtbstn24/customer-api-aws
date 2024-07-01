/* eslint-disable prettier/prettier */
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { filterResponse, getErrorResponse, getFailedResponse, getSuccessResponse, handleResponse, importFileContent, setImportFileContent } from '../common/controllerFunctions';
import { CustomerInterface } from '../common/types/customerTypes';
import { parse } from 'csv-parse';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const importReadCustomerFileController = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let fileName;
    const bucketName = process.env.S3BUCKET_NAME
    console.log('\nGet request made to \\customers\\id : ', event);
    const headers: string[] = [
        "customerID",
        "name",
        "email",
        "address",
        "tel",
        "country",
        "verifiedStatus"
    ]

    try {
        if (event.pathParameters) {
            fileName = event.pathParameters.file;
            console.log('Filename: ', fileName);

            const s3Client = new S3Client({});
            const getFileCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: fileName,
            })

            try {
                const { Body } = await s3Client.send(getFileCommand);
                const fileContent: string = (await Body?.transformToString()) as string;
                console.log('File content : ', fileContent);

                const parseFileContentPromise: Promise<CustomerInterface[]> = new Promise(
                    (resolve, reject) => {
                        parse(fileContent, {
                            delimiter: ",",
                            columns: headers,
                            fromLine: 2,
                        }, (error, result: CustomerInterface[]) => {
                            if (error) {
                                console.error(error);
                                reject(error);
                                return;
                            }
                            resolve(result);
                            return;
                        });
                    }
                );

                const fileRecords: CustomerInterface[] = (await parseFileContentPromise) as CustomerInterface[];

                setImportFileContent(fileRecords);

                return handleResponse(200, fileRecords);

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