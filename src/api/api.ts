import { Configuration, DailyEntriesApi, PersonsApi, SynchronizeApi, VacationRequestsApi, VacationRequestStatusApi } from "../generated/client";

/**
 * Utility class for loading api with predefined configuration
 */
export default class Api {

  /**
   * Gets api configuration
   *
   * @param token accessToken
   * @returns new configuration
   */
  private static getConfiguration(token: string | undefined) {
    return new Configuration({
      basePath: process.env.REACT_APP_API_BASE_URL,
      accessToken: token
    });
  }

  /**
   * Gets initialized DailyEntries API
   * 
   * @param token accessToken
   * @returns initialized DailyEntries API
   */
  public static getDailyEntriesApi(token: string | undefined) {
    return new DailyEntriesApi(Api.getConfiguration(token));
  }

  /**
   * Gets initialized Persons API
   * 
   * @param token accessToken
   * @returns initialized Persons API
   */
  public static getPersonsApi(token: string | undefined) {
    return new PersonsApi(Api.getConfiguration(token));
  }

  /**
   * Gets initialized Synchronize API
   * 
   * @param token accessToken
   * @returns initialized Synchronize API
   */
  public static getSynchronizeApi(token: string | undefined) {
    return new SynchronizeApi(Api.getConfiguration(token));
  }

  /**
   * Gets initialized VacationRequests API
   * 
   * @param token accessToken
   * @returns initialized VacationRequests API
   */
  public static getVacationRequestsApi(token: string | undefined) {
    return new VacationRequestsApi(Api.getConfiguration(token));
  }

  /**
   * Gets initialized VacationRequestStatus API
   * 
   * @param token accessToken
   * @returns initialized VacationRequestStatus API
   */
  public static getVacationRequestStatusApi(token: string | undefined) {
    return new VacationRequestStatusApi(Api.getConfiguration(token));
  }
  
}