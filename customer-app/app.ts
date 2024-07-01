/* eslint-disable prettier/prettier */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { addCustomerController } from './customerControllers/addCustomer';
import { getAllCustomerController } from './customerControllers/getAllCustomer';
import { getCustomerController } from './customerControllers/getCustomer';
import { updateCustomerController } from './customerControllers/updateCustomer';
import { deleteCustomerController } from './customerControllers/deleteCustomer';
import { importCustomerFileController } from './customerControllers/importCustomerFile';
import { getAllCustomerFieldMatchFromCache, getAllCustomerFromCache, insertCustomerToCache } from './common/config/redisConfig';
import { importReadCustomerFileController } from './customerControllers/importReadCustomerFile ';
import { addCacheController } from './customerControllers/addCache';
import { deleteCacheController } from './customerControllers/deleteCache';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const thushari_addCustomerLambdaHandler = addCustomerController;

export const thushari_getAllCustomerLambdaHandler = getAllCustomerController;

export const thushari_getCustomerLambdaHandler = getCustomerController;

export const thushari_updateCustomerLambdaHandler = updateCustomerController;

export const thushari_deleteCustomerLambdaHandler = deleteCustomerController;

export const thushari_importCustomerFileLambdaHandler = importCustomerFileController;

export const thushari_importReadCustomerFileLambdaHandler = importReadCustomerFileController;

export const thushari_addCacheLambdaHandler = addCacheController;

export const thushari_deleteCacheLambdaHandler = deleteCacheController;

export const thushari_lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const cacheData = await getAllCustomerFieldMatchFromCache();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Welcome to the customer API to handle customer operations through endpoints',
                cacheData: cacheData
            }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};
