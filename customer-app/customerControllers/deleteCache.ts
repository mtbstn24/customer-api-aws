/* eslint-disable prettier/prettier */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { filterResponse, getErrorResponse, getFailedResponse, getSuccessResponse, handleInvalidCustomerId, handleResponse } from '../common/controllerFunctions';
import { isCustomerIDValid } from '../common/validations/requestBodyValidations';
import { deleteCustomerFromCache } from '../common/config/redisConfig';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const deleteCacheController = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
                const result = await deleteCustomerFromCache(customerId);
                console.log(result);

                if (result != 0) {
                    const response = {
                        success: true,
                        data: {
                            deletedCount: result
                        }
                    }
                    console.log("Customer records deleted successfully");
                    return handleResponse(200, response);

                } else {
                    console.log('Customer details not found in the cache');
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