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
    DailyEntry,
    DailyEntryFromJSON,
    DailyEntryToJSON,
} from '../models';

export interface ListDailyEntriesRequest {
    personId?: number;
    before?: Date;
    after?: Date;
    vacation?: boolean;
}

/**
 * 
 */
export class DailyEntriesApi extends runtime.BaseAPI {

    /**
     * Lists daily entries.
     * Lists daily entries.
     */
    async listDailyEntriesRaw(requestParameters: ListDailyEntriesRequest): Promise<runtime.ApiResponse<Array<DailyEntry>>> {
        const queryParameters: any = {};

        if (requestParameters.personId !== undefined) {
            queryParameters['personId'] = requestParameters.personId;
        }

        if (requestParameters.before !== undefined) {
            queryParameters['before'] = (requestParameters.before as any).toISOString().substr(0,10);
        }

        if (requestParameters.after !== undefined) {
            queryParameters['after'] = (requestParameters.after as any).toISOString().substr(0,10);
        }

        if (requestParameters.vacation !== undefined) {
            queryParameters['vacation'] = requestParameters.vacation;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters["Authorization"] = `bearer `;
    
        const response = await this.request({
            path: `/v1/dailyEntries`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        });

        return new runtime.JSONApiResponse(response, (jsonValue) => jsonValue.map(DailyEntryFromJSON));
    }

    /**
     * Lists daily entries.
     * Lists daily entries.
     */
    async listDailyEntries(requestParameters: ListDailyEntriesRequest): Promise<Array<DailyEntry>> {
        const response = await this.listDailyEntriesRaw(requestParameters);
        return await response.value();
    }

}
