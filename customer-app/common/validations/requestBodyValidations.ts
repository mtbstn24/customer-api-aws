/* eslint-disable prettier/prettier */
import { Result, ValidationChain, ValidationError, body, validationResult } from 'express-validator';
import { CustomerInterface } from '../types/customerTypes';
import { getCustomerByEmailFromDB, getCustomerByIDFromDB } from '../config/dbConfig';
import Validator from 'validatorjs';

export const runValidations = async (
    body: CustomerInterface,
    validationChain: ValidationChain[]
): Promise<Result<ValidationError>> => {

    const req = { body: body };

    await Promise.all(validationChain.map((validation) => validation.run(req)));

    const errors = validationResult(req);

    return errors;
}

export const invalidFields = (body: string | null) => {

    const allowedFields = ['customerID', 'name', 'email', 'tel', 'address', 'country', 'verifiedStatus'];

    const invalidFieldNames = Object.keys(JSON.parse(body || '')).filter((f) => !allowedFields.includes(f));

    return invalidFieldNames;
}

export const isBodyEmpty = (body: string | null): boolean => {

    if (Object.keys(JSON.parse(body || '')).length == 0) {
        return true;
    }

    return false;
}

export const postBodyValidate: ValidationChain[] = [
    body('customerID', 'customerID does not exist')
        .exists()
        .matches(/[A-Z]\d{4}$/)
        .withMessage('Invalid customerID')
        .custom(async (value) => {
            const result = await getCustomerByIDFromDB(value);
            if (result) {
                throw new Error('customerID already in use')
            }
        }),
    body('name', 'name does not exist').exists().isString().withMessage('Invalid value for name'),
    body('email', 'email does not exist').exists().isEmail().withMessage('Invalid email address')
        .custom(async (value) => {
            const result = await getCustomerByEmailFromDB(value);
            if (result) {
                throw new Error('email already in use')
            }
        }),
    body('tel', 'tel does not exist')
        .exists()
        .matches(/\d{10}$/)
        .withMessage('Invalid value for tel'),
    body('address', 'address does not exist').exists().isString().withMessage('Invalid address value'),
    body('country', 'country does not exist').exists().isString().withMessage('Invalid country value'),
    body('verifiedStatus', 'verifiedStatus does not exist')
        .exists()
        .isBoolean()
        .withMessage('Invalid verified status value'),
];

export const postBodyCacheValidate: ValidationChain[] = [
    body('customerID', 'customerID does not exist')
        .exists()
        .matches(/[A-Z]\d{4}$/)
        .withMessage('Invalid customerID'),
    body('name', 'name does not exist').exists().isString().withMessage('Invalid value for name'),
    body('email', 'email does not exist').exists().isEmail().withMessage('Invalid email address'),
    body('tel', 'tel does not exist')
        .exists()
        .matches(/\d{10}$/)
        .withMessage('Invalid value for tel'),
    body('address', 'address does not exist').exists().isString().withMessage('Invalid address value'),
    body('country', 'country does not exist').exists().isString().withMessage('Invalid country value'),
    body('verifiedStatus', 'verifiedStatus does not exist')
        .exists()
        .isBoolean()
        .withMessage('Invalid verified status value'),
];

export const updateBodyValidate: ValidationChain[] = [
    body('customerID', 'customerID does not exist')
        .optional().matches(/[A-Z]\d{4}$/).withMessage('Invalid customerID')
        .custom(async (value) => {
            const result = await getCustomerByIDFromDB(value);
            if (result) {
                throw new Error('customerID already in use')
            }
        }),
    body('email').optional().isEmail().withMessage('Invalid email address')
        .custom(async value => {
            const result = await getCustomerByEmailFromDB(value);
            if (result) {
                throw new Error('email already in use')
            }
        }),
    body('name').optional().isString().withMessage('Invalid value for name'),
    body('tel').optional().matches(/\d{10}$/).withMessage('Invalid value for tel'),
    body('address').optional().isString().withMessage('Invalid address value'),
    body('country').optional().isString().withMessage('Invalid country value'),
    body('verifiedStatus').optional().isBoolean().withMessage('Invalid verified status value'),
];

export const isCustomerIDValid = (customerId: string): boolean => {
    if (customerId.length == 0) {
        console.log('Encountered request body validation errors');
        console.error('error : Empty customerID');
        return false;
    } else if (!RegExp(/[A-Z]\d{4}$/).exec(customerId)) {
        console.log('Encountered request body validation errors');
        console.error('Invalid customerID');
        return false;
    } else {
        return true
    }
}

export const isExist = async (attribute: string, value: string): Promise<CustomerInterface | null> => {
    let result;
    try {
        if (/customerID/.exec(attribute)) {
            result = await getCustomerByIDFromDB(value);

        } else if (/email/.exec(attribute)) {
            result = await getCustomerByEmailFromDB(value);
        }

        if (result) {
            return result;
        } else {
            return null;
        }

    } catch (error) {
        throw new Error('Cannot connect to database for validation');
    }
}

export const importFileRowValidate = (row: CustomerInterface) => {
    const rules = {
        customerID: 'required|regex:/^[A-Z]{1}\\d{4}$/',
        name: 'required',
        email: 'required|email',
        tel: ['required', 'regex:/\\d{10}$/'],
        address: 'required|string',
        country: 'required|string',
        verifiedStatus: 'required|boolean',
    }

    const validation = new Validator(row, rules);

    const validationResponse = {
        "passed": validation.passes(),
        "errorsCount": validation.errorCount,
        "errors": validation.errors
    }

    return validationResponse;
}