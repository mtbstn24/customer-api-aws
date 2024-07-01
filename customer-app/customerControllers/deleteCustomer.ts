/* eslint-disable prettier/prettier */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { filterResponse, getErrorResponse, getFailedResponse, getSuccessResponse, handleInvalidCustomerId, handleResponse } from '../common/controllerFunctions';
import { isCustomerIDValid } from '../common/validations/requestBodyValidations';
import { deleteCustomerFromDB, getCustomerByIDFromDB } from '../common/config/dbConfig';
import { CustomerInterface } from '../common/types/customerTypes';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const deleteCustomerController = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let customerId;

    if (event.pathParameters) {
        customerId = event.pathParameters.id as string;
        console.log('Requested customer id : ', customerId);
        if (!isCustomerIDValid(customerId)) {
            return handleInvalidCustomerId(customerId);

        }
        else {
            console.log('Trying to delete from database...');
            try {
                //perform find and delete from db
                const resultBefore: CustomerInterface | null = await getCustomerByIDFromDB(customerId);

                if (resultBefore) {
                    console.log('Customer details exists in the database');
                    const result: { deletedCount: number } = await deleteCustomerFromDB(customerId);
                    console.log(resultBefore);
                    console.log(result);

                    if (result.deletedCount != 0 && resultBefore) {
                        const delCustomer: object = filterResponse(resultBefore);

                        // delCache(customerId);
                        // const cacheResult = deleteCustomerFromCache(customerId);
                        // console.log("Cache delete result : ", cacheResult);

                        console.log("Customer records deleted successfully");
                        return handleResponse(200, getSuccessResponse(delCustomer));

                    } else {
                        console.log('Customer details not found in the database');
                        const response = {
                            success: false,
                            message: `Customer record for id ${customerId} not found.`,
                        }
                        return handleResponse(404, response);
                    }

                } else {
                    console.log('Customer details not found in the database');
                    const response = {
                        success: false,
                        message: `Customer record for id ${customerId} not found.`,
                    }
                    return handleResponse(404, response);
                }

            } catch (err) {
                console.log(err);
                return handleResponse(500, getErrorResponse(err));
            }
        }

    } else {
        console.log('CustomerID undefined');
        return handleResponse(400, getFailedResponse('CustomerId undefined'));

    }
};