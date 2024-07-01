/* eslint-disable prettier/prettier */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { isCustomerIDValid } from '../common/validations/requestBodyValidations';
import { filterResponse, getErrorResponse, getFailedResponse, getSuccessResponse, handleInvalidCustomerId, handleResponse } from '../common/controllerFunctions';
import { getCustomerByIDFromDB } from '../common/config/dbConfig';
import { CustomerInterface } from '../common/types/customerTypes';
// import { CustomerInterface } from '../common/types/customerTypes';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const getCustomerController = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    let customerId;
    console.log('\nGet request made to \\customers\\id : ', event);

    if (event.pathParameters) {
        customerId = event.pathParameters.id as string;
        console.log('Requested customer id : ', customerId);

        if (!isCustomerIDValid(customerId)) {
            return handleInvalidCustomerId(customerId);

        } else {
            try {
                //get from cache
                const cacheResult = null;

                if (!cacheResult) {
                    console.log('Trying to retrieve from database...');
                    try {
                        const result: CustomerInterface | null = await getCustomerByIDFromDB(customerId);
                        console.log(result);

                        let response = {};

                        if (result) {
                            console.log('Customer records retrieved successfully');
                            const resCustomers: object = filterResponse(result);
                            response = getSuccessResponse(resCustomers);
                            // setCache(customerId, result);

                        } else {
                            console.log('Customer records retrieval failed');
                            response = getFailedResponse(`Customer record for id ${customerId} not found.`);
                        }
                        return handleResponse(200, response);

                    } catch (err) {
                        console.error(err);
                        return handleResponse(500, getErrorResponse(err));
                    }

                } else {
                    // let resCustomers: object = filterResponse(cacheResult);
                    const response = {
                        success: true,
                        // data: resCustomers
                    }
                    return handleResponse(200, response);

                }

            } catch (err) {
                console.error(err);
                return handleResponse(500, getErrorResponse(err));

            }
        }

    } else {
        console.log('CustomerID undefined');
        return handleResponse(400, getFailedResponse('CustomerId undefined'));

    }
};