/* eslint-disable prettier/prettier */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { filterResponse, getErrorResponse, getFailedResponse, getSuccessResponse, handleResponse } from '../common/controllerFunctions';
import { getAllCustomersFromDB } from '../common/config/dbConfig';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const getAllCustomerController = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('\nGet request made to \\customers : ', event);

    try {
        let cacheData: any[] | undefined;
        // let cacheData = await getAllCache();
        console.log(cacheData);

        if (!cacheData || cacheData.length == 0) {
            console.log('Cache retrieval failed');
            console.log('Trying to retrieve from database...');

            try {
                let customers: any[] = [];
                customers = await getAllCustomersFromDB(); // get from db
                console.log(customers);

                if (customers) {
                    const resCustomers: object[] = [];
                    customers.forEach(customer => {
                        // setCache(customer.customerID, customer);
                        const data: object = filterResponse(customer);
                        resCustomers.push(data);
                    });
                    return handleResponse(200, getSuccessResponse(resCustomers));

                } else {
                    console.log("Database retieval failed");
                    return handleResponse(500, getFailedResponse('Customer details retrieval failed'));
                }

            } catch (err) {
                console.error(err);
                return handleResponse(500, getErrorResponse(err));
            }

        } else {
            const resCustomers: any[] = [];
            cacheData.forEach(customer => {
                const data: object = filterResponse(customer);
                resCustomers.push(data);
            });
            return handleResponse(200, getSuccessResponse(resCustomers));
        }

    } catch (err) {
        console.log(err);
        return handleResponse(500, getErrorResponse(err));
    }
};