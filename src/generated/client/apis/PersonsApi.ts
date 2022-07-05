/* tslint:disable */
/* eslint-disable */
/**
 * Timebank
 * Timebank API documentation
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';
import {
    Person,
    PersonFromJSON,
    PersonToJSON,
    PersonTotalTime,
    PersonTotalTimeFromJSON,
    PersonTotalTimeToJSON,
    Timespan,
    TimespanFromJSON,
    TimespanToJSON,
} from '../models';

export interface ListPersonTotalTimeRequest {
    personId: number;
    timespan?: Timespan;
}

export interface ListPersonsRequest {
    active?: boolean;
}

/**
 * 
 */
export class PersonsApi extends runtime.BaseAPI {

    /**
     * Lists persons total time entries.
     * Lists persons total time entries.
     */
    async listPersonTotalTimeRaw(requestParameters: ListPersonTotalTimeRequest): Promise<runtime.ApiResponse<Array<PersonTotalTime>>> {
        if (requestParameters.personId === null || requestParameters.personId === undefined) {
            throw new runtime.RequiredError('personId','Required parameter requestParameters.personId was null or undefined when calling listPersonTotalTime.');
        }

        const queryParameters: any = {};

        if (requestParameters.timespan !== undefined) {
            queryParameters['timespan'] = requestParameters.timespan;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters["Authorization"] = `bearer `;
  
        const response = await this.request({
            path: `/v1/persons/{personId}/total`.replace(`{${"personId"}}`, encodeURIComponent(String(requestParameters.personId))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        });

        return new runtime.JSONApiResponse(response, (jsonValue) => jsonValue.map(PersonTotalTimeFromJSON));
    }

    /**
     * Lists persons total time entries.
     * Lists persons total time entries.
     */
    async listPersonTotalTime(requestParameters: ListPersonTotalTimeRequest): Promise<Array<PersonTotalTime>> {
        const response = await this.listPersonTotalTimeRaw(requestParameters);
        return await response.value();
    }

    /**
     * Get list of Timebank persons.
     * Get list of Timebank persons.
     */
    async listPersonsRaw(requestParameters: ListPersonsRequest): Promise<runtime.ApiResponse<Array<Person>>> {
        const queryParameters: any = {};

        if (requestParameters.active !== undefined) {
            queryParameters['active'] = requestParameters.active;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters["Authorization"] = `bearer `;
   
        const response = await this.request({
            path: `/v1/persons`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        });

        return new runtime.JSONApiResponse(response, (jsonValue) => jsonValue.map(PersonFromJSON));
    }

    /**
     * Get list of Timebank persons.
     * Get list of Timebank persons.
     */
    async listPersons(requestParameters: ListPersonsRequest): Promise<Array<Person>> {
        const response = await this.listPersonsRaw(requestParameters);
        return await response.value();
    }

}
