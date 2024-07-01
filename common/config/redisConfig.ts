/* eslint-disable prettier/prettier */
import { Redis } from 'ioredis';
import { CustomerInterface } from '../types/customerTypes';
// import { createClient } from 'redis';

const REDIS_HOST: string | undefined = process.env.REDIS_ENDPOINT;
const REDIS_PORT: string | undefined = process.env.REDIS_PORT;

let redisClient: Redis | undefined;

const connectRedis = async () => {
    if (!redisClient) {
        console.log(REDIS_HOST);

        redisClient = new Redis({
            port: Number(REDIS_PORT),
            host: REDIS_HOST,
        });

        redisClient.on('error', (err) => { console.log('Redis connection error : ', err) });
        redisClient.on('connect', () => { console.log('Redis connection successful') });

    } else {
        console.log('Redis already connected');
    }

    return redisClient;
}

export const getCustomerByIDFromCache = async (customerId: string) => {

    const client = await connectRedis();

    try {
        const cacheData = await client.hget('thushari_customer_app', customerId);
        if (cacheData) {
            console.log("Customer detail retrieved from cache successfully");
        } else {
            console.log("Customer detail does not exist in cache");
        }
        return cacheData ? JSON.parse(cacheData) : null;

    } catch (error) {
        console.error('Error getting cache: ', error);
        throw (error);

    }
}

export const getAllCustomerFromCache = async () => {

    const client = await connectRedis();

    try {
        const cacheData = await client.hgetall('thushari_customer_app');
        if (cacheData) {
            console.log("Customer details retrieved from cache successfully");
        } else {
            console.log("Customer details does not exist in cache");
        }
        return cacheData;

    } catch (error) {
        console.error('Error getting cache: ', error);
        throw (error);

    }
}

export const getAllCustomerFieldMatchFromCache = async () => {

    const client = await connectRedis();
    let allCacheData: CustomerInterface[] = [];

    try {
        // const cacheData = await client.hget('thushari_customer_app', `[A-Z][0-9][0-9][0-9][0-9]`);
        const cachekeys = await client.hkeys('thushari_customer_app');

        const redisGetPromises = cachekeys.map(async (key) => {
            const cacheResult = await client.hget('thushari_customer_app', key);
            const data = cacheResult ? JSON.parse(cacheResult) : {};
            return data;
        });

        allCacheData = await Promise.all(redisGetPromises);

        if (allCacheData) {
            console.log("Customer details retrieved from cache successfully");
        } else {
            console.log("Customer details does not exist in cache");
        }

        return allCacheData || [];

    } catch (error) {
        console.error('Error getting cache: ', error);
        throw (error);

    }
}

export async function insertCustomerToCache(key: string, data: object) {

    const client = await connectRedis();

    try {
        // await client.set(key, JSON.stringify(data));
        await client.hset('thushari_customer_app', key, JSON.stringify(data));
        console.log("Customer detail cached successfully");

    } catch (error) {
        console.error('Error caching: ', error);
        throw (error);
    }
}

export const deleteCustomerFromCache = async (customerId: string) => {

    const client = await connectRedis();

    try {
        const cacheData = await client.hdel('thushari_customer_app', customerId);
        if (cacheData) {
            console.log("Customer detail deleted from cache successfully");
        } else {
            console.log("Customer detail does not exist in cache");
        }
        return cacheData;

    } catch (error) {
        console.error('Error getting cache: ', error);
        throw (error);

    }
}