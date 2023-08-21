import { useContext, useEffect, useState } from "react";
import { Collapse, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box } from "@mui/material";
import useEditorContentStyles from "styles/editor-content/editor-content";
import theme from "theme/theme";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import strings from "localization/strings";
import { VacationRequest, VacationRequestStatus, VacationRequestStatuses, VacationType } from "generated/client";
import { useAppSelector } from "app/hooks";
import { selectPerson } from "features/person/person-slice";
import Api from "api/api";
import { selectAuth } from "features/auth/auth-slice";
import { ErrorContext } from "components/error-handler/error-handler";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VacationRequestForm from "./vacationRequestForm";
import { VacationData } from "types";

/**
 * Renders vacation request table
 */
const RenderVacationRequests = () => {
  const classes = useEditorContentStyles();
  const { person } = useAppSelector(selectPerson);
  const { accessToken } = useAppSelector(selectAuth);
  const [ openEdit, setOpenEdit ] = useState<boolean[]>([]);
  const [ openDetails, setOpenDetails ] = useState<boolean[]>([]);
  const context = useContext(ErrorContext);
  const [ requests, setRequests ] = useState<VacationRequest[]>([]);
  const [ statuses, setStatuses ] = useState<VacationRequestStatus[]>([]);
  const [ latestRequestStatuses, setLatestRequestStatuses ] = useState<VacationRequestStatus[]>([]);
  const [vacationRequest, setVacationRequest] = useState<VacationData>({
    startDate: new Date(),
    endDate: new Date(),
    type: VacationType.VACATION,
    message: "",
    days: 1
  });
  const [updatedVacationRequest, setUpdatedVacationRequest] = useState<VacationData>({
    startDate: new Date(),
    endDate: new Date(),
    type: VacationType.VACATION,
    message: "",
    days: 1
  });

  /**
   * Initializes all vacation requests
   */
  const initializeRequests = async () => {
    if (!person) return;

    try {
      const vacationsApi = Api.getVacationRequestsApi(accessToken?.access_token);
      // Hardcoded personId for testing purposes, use person.keyCloakId for staging
      // Use your own keyCloakId, if you wish to display vacation requests created by you
      // It is currently a limitation of the TimeBankApi. It puts your keyCloakId in the
      // vacation request when creating a new vacation request, regardless of the Id you use here
      const vacations = await vacationsApi.listVacationRequests({ personId: "eeb18958-9644-4a6d-bc4d-7b250fc90f4f" });
      // const vacations = await vacationsApi.listVacationRequests({ personId: person.keycloakId });
      setRequests(vacations);
    } catch (error) {
      context.setError(strings.errorHandling.fetchVacationDataFailed, error);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    initializeRequests();
  }, [person]);

  /**
   * Initializes all vacation request statuses
   */
  const initializeRequestStatuses = async () => {
    if (!person) return;

    try {
      const vacationRequestStatuses: VacationRequestStatus[] = [];

      const statusesApi = Api.getVacationRequestStatusApi(accessToken?.access_token);

      await Promise.all(requests.map(async request => {
        const createdStatuses = await statusesApi.listVacationRequestStatuses({ id: request.id! });
        createdStatuses.forEach(createdStatus => {
          vacationRequestStatuses.push(createdStatus);
        });
      }));

      setStatuses(vacationRequestStatuses);
    } catch (error) {
      context.setError(strings.errorHandling.fetchVacationDataFailed, error);
    }
  };

  useEffect(() => {
    if (requests.length <= 0) {
      return;
    }
    initializeRequestStatuses();
  }, [requests]);

  /**
   * Initializes all the latest vacation request statuses, so there would be only one status for each request showed on the UI
   */
  const initializeLatestStatuses = async () => {
    const latestStatuses: VacationRequestStatus[] = [];

    requests.forEach(request => {
      const requestStatuses: VacationRequestStatus[] = [];
  
      // Get statuses for this particular request
      statuses.forEach(status => {
        if (request.id === status.vacationRequestId) {
          requestStatuses.push(status);
        }
      });
  
      // Pick the latest statuses
      if (requestStatuses.length > 0) {
        const pickedStatus = requestStatuses.reduce((a, b) => (a.updatedAt! > b.updatedAt! ? a : b));
        latestStatuses.push(pickedStatus);
      }
    });

    setLatestRequestStatuses(latestStatuses);
  };

  useEffect(() => {
    if (statuses.length <= 0) {
      return;
    }
    initializeLatestStatuses();
  }, [statuses]);

  /**
 * Handle opening and closing details and edit
 *
 * @param index index of the request
 */
  const handleDetails = (index: number) => {
    const newOpenRows = [...openDetails];
    newOpenRows[index] = !newOpenRows[index];
    setOpenDetails(newOpenRows);
  };

  /**
 * Handle opening and closing details and edit
 *
 * @param index index of the request
 * @param request default values for edited request
 */
  const handleEdit = (index: number, request?: VacationData) => {
    if (request) {
      setUpdatedVacationRequest({
        startDate: request.startDate,
        endDate: request.endDate,
        type: request.type,
        message: request.message,
        days: request.days
      });
    }
    const newOpenRows = [...openEdit];
    newOpenRows[index] = !newOpenRows[index];
    setOpenEdit(newOpenRows);
  };

  /**
  * Handle vacation apply button
  * Sends vacation request to database
  * @param createdRequestId id of newly created vacation request
  */
  const createVacationRequestStatus = async (createdRequestId: string | undefined) => {
    if (!person || !person.keycloakId) return;
    
    try {
      const applyApi = Api.getVacationRequestStatusApi(accessToken?.access_token);

      const createdStatus = await applyApi.createVacationRequestStatus({
        id: createdRequestId!,
        vacationRequestStatus: {
          vacationRequestId: createdRequestId,
          status: VacationRequestStatuses.PENDING,
          message: vacationRequest.message,
          createdAt: new Date(),
          createdBy: person.keycloakId,
          updatedAt: new Date(),
          updatedBy: person.keycloakId
        }
      });

      setStatuses([...statuses, createdStatus]);
    } catch (error) {
      context.setError(strings.errorHandling.fetchVacationDataFailed, error);
    }
  };
  /**
  * Handle vacation apply button
  * Sends vacation request to database
  */
  const createVacationRequest = async () => {
    if (!person || !person.keycloakId) return;

    try {
      const applyApi = Api.getVacationRequestsApi(accessToken?.access_token);

      const createdRequest = await applyApi.createVacationRequest({
        vacationRequest: {
          personId: person.keycloakId,
          createdBy: person.keycloakId,
          startDate: vacationRequest.startDate,
          endDate: vacationRequest.endDate,
          type: vacationRequest.type,
          message: vacationRequest.message,
          createdAt: new Date(),
          updatedAt: new Date(),
          days: vacationRequest.days
        }
      });

      setRequests([...requests, createdRequest]);
      createVacationRequestStatus(createdRequest.id);
    } catch (error) {
      context.setError(strings.errorHandling.fetchVacationDataFailed, error);
    }
  };

  /**
   * Updates the vacation request
   *
   * @param id id updated vacation request
   * @param index index of request in list
   */
  const updateVacationRequest = async (id: string, index: number) => {
    const requestToBeUpdated = requests.find(request => request.id === id);
    if (!person || !requestToBeUpdated) return;

    try {
      const updateApi = Api.getVacationRequestsApi(accessToken?.access_token);
      const updatedRequest = await updateApi.updateVacationRequest({
        id: id,
        vacationRequest: {
          ...requestToBeUpdated,
          startDate: updatedVacationRequest.startDate,
          endDate: updatedVacationRequest.endDate,
          type: updatedVacationRequest.type,
          message: updatedVacationRequest.message,
          updatedAt: new Date(),
          days: updatedVacationRequest.days
        }
      });

      const update = requests.map(request => (request.id !== id ? request : updatedRequest));
      setRequests(update);
    } catch (error) {
      context.setError(strings.errorHandling.fetchVacationDataFailed, error);
    }
    handleEdit(index);
  };

  /**
   * Method to delete vacation request
   *
   * @param id id updated vacation request
   * @param index index of request in list
   */
  const deleteRequest = async (id: string, index: number) => {
    try {
      await Api.getVacationRequestsApi(accessToken?.access_token).deleteVacationRequest({
        id: id
      });
    } catch (error) {
      context.setError(strings.errorHandling.fetchVacationDataFailed, error);
    }
    setRequests(requests.filter(request => request.id !== id));

    handleEdit(index);
  };

  /**
 * Handle request type
 *
 * @param type Type of vacation
 */
  const handleRequestType = (type: VacationType) => {
    switch (type) {
      case VacationType.VACATION:
        return strings.vacationRequests.vacation;
      case VacationType.PERSONAL_DAYS:
        return strings.vacationRequests.personalDays;
      case VacationType.UNPAID_TIME_OFF:
        return strings.vacationRequests.unpaidTimeOff;
      case VacationType.MATERNITY_PATERNITY:
        return strings.vacationRequests.maternityPaternityLeave;
      case VacationType.SICKNESS:
        return strings.vacationRequests.sickness;
      case VacationType.CHILD_SICKNESS:
        return strings.vacationRequests.childSickness;
      default:
        return strings.vacationRequests.vacation;
    }
  };

  /**
   * Handle request status
   *
   * @param requestStatus Vacation requests status
   */
  const handleRequestStatus = (requestStatus: VacationRequestStatuses) => {
    const statusMap = {
      [VacationRequestStatuses.PENDING]: strings.vacationRequests.pending,
      [VacationRequestStatuses.APPROVED]: strings.vacationRequests.approved,
      [VacationRequestStatuses.DECLINED]: strings.vacationRequests.declined
    };

    return statusMap[requestStatus] || "";
  };

  return (
    <Box>
      <Box className={ classes.employeeVacationRequests }>
        <Typography variant="h2" padding={ theme.spacing(2) }>
          { strings.vacationRequests.applyForVacation }
        </Typography>
        <VacationRequestForm
          buttonLabel={strings.generic.apply}
          onClick={() => createVacationRequest()}
          vacationData={vacationRequest}
          setVacationData={setVacationRequest}
        />
      </Box>
      <Box className={ classes.employeeVacationRequests }>
        <Typography variant="h2" padding={ theme.spacing(2) }>
          { strings.header.requests }
        </Typography>
        <TableContainer style={{ marginBottom: "10px", width: "100%" }}>
          <Table aria-label="collapsible table" style={{ marginBottom: "1em" }}>
            <TableHead>
              <TableRow>
                <TableCell style={{ paddingLeft: "3em", width: "20%" }}>{ strings.header.vacationType }</TableCell>
                <TableCell style={{ width: "20%" }}>{ strings.header.startDate }</TableCell>
                <TableCell style={{ width: "20%" }}>{ strings.header.endDate }</TableCell>
                <TableCell style={{ width: "10%" }}>{ strings.header.days }</TableCell>
                <TableCell style={{ width: "10%" }}>{ strings.header.status }</TableCell>
                <TableCell style={{ width: "10%" }}/>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request: VacationRequest, index: number) => (
                <>
                  <TableRow key={ request.id }>
                    <TableCell style={{ paddingLeft: "3em" }}>{ handleRequestType(request.type) }</TableCell>
                    <TableCell>{ request.startDate.toDateString() }</TableCell>
                    <TableCell>{ request.endDate.toDateString() }</TableCell>
                    <TableCell>{ request.days }</TableCell>
                    {latestRequestStatuses.map(latestStatus => {
                      return (
                        <>
                          {request.id === latestStatus.vacationRequestId &&
                            <TableCell
                              key={`status-${latestStatus.id}`}
                              sx={{ "&.pending": { color: "#FF493C" }, "&.approved": { color: "#45cf36" } }}
                              className={latestStatus.status === "APPROVED" ? "approved" : "pending"}
                            >
                              { handleRequestStatus(latestStatus.status) }
                            </TableCell>
                          }
                        </>
                      );
                    })}
                    <TableCell>
                      <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => {
                          handleDetails(index);
                        }}
                      >
                        { openDetails[index] ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/> }
                      </IconButton>
                      <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => { handleEdit(index, request); }}
                      >
                        { openEdit[index] ? <EditIcon color="success"/> : <EditIcon/> }
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ padding: 0 }} colSpan={6} >
                      <Collapse in={ openDetails[index] } timeout="auto" unmountOnExit>
                        <Box sx={{ width: "100%" }}>
                          <Table size="small" aria-label="purchases">
                            <TableHead>
                              <TableRow>
                                <TableCell style={{ paddingLeft: "3em", width: "20%" }}>{ strings.vacationRequests.message }</TableCell>
                                <TableCell style={{ width: "20%" }}>{ strings.vacationRequests.created }</TableCell>
                                <TableCell style={{ width: "20%" }}>{ strings.vacationRequests.updated }</TableCell>
                                <TableCell style={{ width: "10%" }}>Päivittänyt:</TableCell>
                                <TableCell style={{ width: "10%" }}>{ strings.vacationRequests.projectManager }</TableCell>
                                <TableCell style={{ width: "10%" }}>{ strings.vacationRequests.humanResourcesManager }</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow>
                                <TableCell style={{ paddingLeft: "3em", border: 0 }}>{ request.message }</TableCell>
                                <TableCell style={{ border: 0 }}>{ request.createdAt.toDateString() }</TableCell>
                                <TableCell style={{ border: 0 }}>{ request.updatedAt.toDateString() }</TableCell>
                                <TableCell style={{ border: 0 }}>Henkilö</TableCell>
                                {/* <TableCell style={{ border: 0 }}>{ request.projectManagerStatus }</TableCell>
                                <TableCell style={{ border: 0 }}>{ request.hrManagerStatus }</TableCell> */}
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                      <Collapse in={ openEdit[index] } timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 0, width: "100%" }}>
                          <Table size="small" aria-label="purchases">
                            <TableHead/>
                            <TableBody>
                              <TableRow>
                                <TableCell style={{ border: 0 }}>
                                  <VacationRequestForm
                                    buttonLabel={strings.generic.saveChanges}
                                    onClick={() => updateVacationRequest(request.id!, index)}
                                    vacationData={updatedVacationRequest}
                                    setVacationData={setUpdatedVacationRequest}
                                  />
                                </TableCell>
                                <TableCell style={{ border: 0 }}>
                                  <IconButton
                                    onClick={() => deleteRequest(request.id!, index)}
                                    aria-label="delete"
                                    className={ classes.deleteButton }
                                    size="large"
                                  >
                                    <DeleteIcon fontSize="medium"/>
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default RenderVacationRequests;