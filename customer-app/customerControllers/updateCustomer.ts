/* eslint-disable prettier/prettier */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { invalidFields, isBodyEmpty, isCustomerIDValid, runValidations, updateBodyValidate } from '../common/validations/requestBodyValidations';
import { filterResponse, getErrorResponse, getFailedResponse, getSuccessResponse, handleInvalidCustomerId, handleResponse } from '../common/controllerFunctions';
import { CustomerInterface } from '../common/types/customerTypes';
import { getCustomerByIDFromDB, updateCustomerToDB } from '../common/config/dbConfig';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const updateCustomerController = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    console.log('\nPatch request made to \\customers : ', event);

    let customerId;
    const requestBody: CustomerInterface = JSON.parse(event.body || '');
    const invalidFieldsFound = invalidFields(event.body);

    if (invalidFieldsFound.length > 0) {
        const response = {
            success: false,
            error: 'Invalid field names exist in the request body',
            message: {
                invalid: invalidFieldsFound,
            },
        };
        return handleResponse(400, response);
    }

    if (isBodyEmpty(event.body)) {
        const response = {
            success: false,
            message: 'Empty request body received'
        };
        return handleResponse(400, response);
    }

    if (event.pathParameters) {
        customerId = event.pathParameters.id as string;
        console.log('Requested customer id : ', customerId);

        const validationErrors = await runValidations(requestBody, updateBodyValidate);

        if (!isCustomerIDValid(customerId)) {
            return handleInvalidCustomerId(customerId);

        }
        else if (!validationErrors.isEmpty()) {
            console.log('Encountered request body validation errors');
            console.error(validationErrors.array());
            const response: object = {
                success: false,
                error: 'Invalid request body',
                message: validationErrors.array()
            };
            return handleResponse(400, response);

        }
        else {
            try {
                //find in db to get the id
                const existingDetails: CustomerInterface | null = await getCustomerByIDFromDB(customerId);

                if (existingDetails) {
                    console.log('Customer details exist in the database');
                    //update by id
                    const result: CustomerInterface | null = await updateCustomerToDB(existingDetails._id, customerId, requestBody);
                    console.log(result);

                    if (result) {
                        const resCustomers: object = filterResponse(result);
                        console.log("Customer record updated successfully");
                        // setCache(customerId, result);
                        return handleResponse(200, getSuccessResponse(resCustomers));

                    } else {
                        return handleResponse(500, getFailedResponse(`Customer detail unable to update.`));
                    }


                } else {
                    console.log('Customer details not found in the database');
                    return handleResponse(404, getFailedResponse(`Customer record for id ${customerId} not found.`));
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