/* eslint-disable prettier/prettier */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { filterResponse, getErrorResponse, getFailedResponse, getSuccessResponse, handleResponse } from '../common/controllerFunctions';
import {
    invalidFields,
    isBodyEmpty,
    postBodyCacheValidate,
    runValidations,
} from '../common/validations/requestBodyValidations';
import { CustomerInterface } from '../common/types/customerTypes';
import { insertCustomerToCache } from '../common/config/redisConfig';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const addCacheController = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    console.log('\nPost request made to \\customers : ', event);

    const requestBody: CustomerInterface = JSON.parse(event.body || '');
    const invalidFieldsFound = invalidFields(event.body);

    if (invalidFieldsFound.length > 0) {
        const response = {
            success: false,
            error: 'Invalid field names exist in the request body',
            msg: {
                invalid: invalidFieldsFound,
            },
        };
        return handleResponse(400, response);
    }

    if (isBodyEmpty(event.body)) {
        const response = {
            success: false,
            error: 'Empty request body received',
        };
        return handleResponse(400, response);
    }

    const validationErrors = await runValidations(requestBody, postBodyCacheValidate);

    if (!validationErrors.isEmpty()) {
        console.log('Encountered request body validation errors');
        console.error(validationErrors.array());
        const response = {
            success: false,
            error: 'Invalid request body',
            message: validationErrors.array()
        };
        return handleResponse(400, response);

    } else {
        console.log('No request body validation errors');
        try {
            console.log(requestBody);

            await insertCustomerToCache(requestBody.customerID, requestBody);
            return handleResponse(201, getSuccessResponse(requestBody));

        } catch (err) {
            console.log(err);
            return handleResponse(500, getErrorResponse(err));
        }
    }
};
