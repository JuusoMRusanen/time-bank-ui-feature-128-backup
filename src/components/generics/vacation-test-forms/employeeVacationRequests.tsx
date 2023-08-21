import { Box, Button, Collapse, FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, styled, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import useEditorContentStyles from "styles/editor-content/editor-content";
import theme from "theme/theme";
import { useState, useEffect, useContext, useRef } from "react";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { CalendarPickerView } from "@mui/x-date-pickers";
import strings from "localization/strings";
import DateRangePicker from "../date-range-picker/date-range-picker";
import { FilterScopes, VacationRequestSort } from "types";
import { Person, VacationRequest, VacationRequestStatus, VacationRequestStatuses, VacationType } from "generated/client";
import { useAppSelector } from "app/hooks";
import { ErrorContext } from "components/error-handler/error-handler";
import { selectPerson } from "features/person/person-slice";
import { selectAuth } from "features/auth/auth-slice";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import Api from "api/api";

/**
 * Component properties
 */
interface Props {
  persons: Person[]
}

/**
 * Styled expandable table row
 */
const StyledTableRow = styled(TableRow)(() => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0
  }
}));

/**
 * Styled expandable table cell
 */
const StyledTableCell = styled(TableCell)(() => ({
  "& .pending": {
    color: "#FF493C"
  },
  "& .approved": {
    color: "#45cf36"
  },
  // eslint-disable-next-line no-restricted-globals
  ...(status === "APPROVED" ? { "&.approved": {} } : { "&.pending": {} })

}));

/**
 * renders employee vacation request view
 */
const RenderEmployeeVacationRequests = ({ persons }: Props) => {
  const classes = useEditorContentStyles();
  const [ status, setStatus ] = useState<VacationRequestStatuses>(VacationRequestStatuses.PENDING);
  const [ employee, setEmployee ] = useState("Everyone");
  const [ vacationType, setVacationType ] = useState<VacationType>(VacationType.VACATION);
  const [ dateFormat ] = useState("yyyy.MM.dd");
  const [ datePickerView ] = useState<CalendarPickerView>("day");
  const [ selectedVacationStartDate, setSelectedVacationStartDate ] = useState(new Date());
  const [ selectedVacationEndDate, setSelectedVacationEndDate ] = useState(new Date());
  const { person } = useAppSelector(selectPerson);
  const { accessToken } = useAppSelector(selectAuth);
  const context = useContext(ErrorContext);
  const [ requests, setRequests ] = useState<VacationRequest[]>([]);
  const [ statuses, setStatuses ] = useState<VacationRequestStatus[]>([]);
  const [ latestRequestStatuses, setLatestRequestStatuses ] = useState<VacationRequestStatus[]>([]);
  const [ openRows, setOpenRows ] = useState<boolean[]>([]);
  const [sortBy, setSortBy] = useState<VacationRequestSort>(VacationRequestSort.START_DATE);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [ loading, setLoading ] = useState<boolean>(false);
  const [ approvalChanged, setApprovalChanged ] = useState<boolean>(false);
  const myRef = useRef<any>();

  /**
   * Initializes all vacation requests
   */
  const initializeRequests = async () => {
    try {
      const vacationsApi = Api.getVacationRequestsApi(accessToken?.access_token);

      // Hardcoded personId for testing purposes, use person.keyCloakId for staging 
      const vacations = await vacationsApi.listVacationRequests({ personId: "eeb18958-9644-4a6d-bc4d-7b250fc90f4f" });
      // const vacations = await vacationsApi.listVacationRequests({ personId: person?.keycloakId });

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
    // if (!person) {
    //   console.log("no person or person keycloakId");
    //   return;
    // }

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
      setLoading(false);
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
      statuses.forEach(status1 => {
        if (request.id === status1.vacationRequestId) {
          requestStatuses.push(status1);
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
   * Handle employee change
   *
   * @param event select employee
   */
  const handleEmployeeChange = (event: SelectChangeEvent) => {
    const contentValue = event.target.value;
    setEmployee(contentValue);
  };

  /**
   * Renders employee selection
   */
  const renderEmployeeSelection = () => (
    <FormControl
      variant="standard"
      sx={{
        margin: 1,
        minWidth: 165,
        marginBottom: 4
      }}
    >
      <InputLabel>{ strings.vacationRequests.employee }</InputLabel>
      <Select
        value={ employee }
        onChange={ handleEmployeeChange }
        label={ strings.vacationRequests.employee }
      >
        <MenuItem value="Everyone">
          {strings.vacationRequests.everyone}
        </MenuItem>
        {persons.map(p => (
          <MenuItem key={p.id} value={p.id}>
            {`${p.firstName} ${p.lastName}`}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  /**
   * Method to handle vacation starting date change
   *
   * @param date selected date
   */
  const handleVacationStartDateChange = (date: Date | null) => {
    date && setSelectedVacationStartDate(date);
  };

  /**
   * Method to handle vacation ending date change
   *
   * @param date selected date
   */
  const handleVacationEndDateChange = (date: Date | null) => {
    date && setSelectedVacationEndDate(date);
  };

  /**
   * set the string to corresponding enum value
   *
   * @param filterString filter scope as string
   */
  const handleVacationType = (typeString: string) => {
    switch (typeString) {
      case "VACATION":
        return VacationType.VACATION;
      case "UNPAID_TIME_OFF":
        return VacationType.UNPAID_TIME_OFF;
      case "SICKNESS":
        return VacationType.SICKNESS;
      case "PERSONAL_DAYS":
        return VacationType.PERSONAL_DAYS;
      case "MATERNITY_PATERNITY":
        return VacationType.MATERNITY_PATERNITY;
      case "CHILD_SICKNESS":
        return VacationType.CHILD_SICKNESS;
      default:
        return null;
    }
  };

  /**
   * Handle vacation type
   *
   * @param event Change event
   */
  const handleVacationTypeChange = ({ target: { value } }: SelectChangeEvent) => {
    const contentValue = handleVacationType(value);

    if (!contentValue) return;

    setVacationType(contentValue);
  };

  /**
   * set the string to corresponding enum value
   *
   * @param filterString filter scope as string
   */
  const handleVacationStatus = (statusString: string) => {
    switch (statusString) {
      case "PENDING":
        return VacationRequestStatuses.PENDING;
      case "APPROVED":
        return VacationRequestStatuses.APPROVED;
      case "DECLINED":
        return VacationRequestStatuses.DECLINED;
      default:
        return null;
    }
  };

  /**
 * Handle status change
 *
 * @param event Select change event
 */
  const handleStatusChange = ({ target: { value } }: SelectChangeEvent) => {
    const contentValue = handleVacationStatus(value);

    if (!contentValue) return;

    setStatus(contentValue);
  };

  /**
   * Renders the vacation type selection
   */
  const renderVacationType = () => (
    <FormControl
      variant="standard"
      sx={{
        margin: 1,
        minWidth: 165,
        marginBottom: 4
      }}
    >
      <InputLabel>{ strings.vacationRequests.vacationType }</InputLabel>
      <Select
        value={ vacationType }
        onChange={ handleVacationTypeChange }
        label={ strings.vacationRequests.vacationType }
      >
        <MenuItem value={ VacationType.VACATION }>
          { strings.vacationRequests.vacation }
        </MenuItem>
        <MenuItem value={ VacationType.UNPAID_TIME_OFF}>
          { strings.vacationRequests.unpaidTimeOff }
        </MenuItem>
        <MenuItem value={ VacationType.SICKNESS}>
          { strings.vacationRequests.sickness }
        </MenuItem>
        <MenuItem value={ VacationType.PERSONAL_DAYS }>
          { strings.vacationRequests.personalDays }
        </MenuItem>
        <MenuItem value={ VacationType.MATERNITY_PATERNITY }>
          { strings.vacationRequests.maternityPaternityLeave }
        </MenuItem>
        <MenuItem value={ VacationType.CHILD_SICKNESS }>
          {strings.vacationRequests.childSickness }
        </MenuItem>
      </Select>
    </FormControl>
  );

  /**
   * Renders the vacation type selection
   */
  const renderRequestStatus = () => (
    <FormControl
      variant="standard"
      sx={{
        m: 1, minWidth: 165, marginBottom: 4
      }}
    >
      <InputLabel>{ strings.vacationRequests.status }</InputLabel>
      <Select
        value={ status }
        onChange={handleStatusChange}
        label={ strings.vacationRequests.status }
      >
        <MenuItem value={ VacationRequestStatuses.PENDING }>
          { strings.vacationRequests.pending }
        </MenuItem>
        <MenuItem value={ VacationRequestStatuses.APPROVED }>
          { strings.vacationRequests.approved }
        </MenuItem>
        <MenuItem value={ VacationRequestStatuses.DECLINED }>
          { strings.vacationRequests.declined }
        </MenuItem>
      </Select>
    </FormControl>
  );

  /**
   * Method to handle person names on vacation applications
   *
   * @param id
   * @returns foundPerson.firstName and foundPerson.lastName
   */
  const handlePersonNames = (id: string) => {
    const foundPerson = persons.find(p => p.keycloakId === id);
    if (foundPerson) {
      return `${foundPerson.firstName} ${foundPerson.lastName}`;
    }
    return "null";
  };

  /**
 * Handle the column header click and update the sorting state
 * @param column
 */
  const handleSort = (column: VacationRequestSort) => {
    if (column === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  /**
   * Sorting function for vacation applications
   */
  const sortedVacationRequests = requests.sort((a, b) => {
    if (sortBy === VacationRequestSort.DAYS) {
      const daysA = Number(a.days);
      const daysB = Number(b.days);
      return sortOrder === "asc" ? daysA - daysB : daysB - daysA;
    }

    if (sortBy === VacationRequestSort.START_DATE) {
      const dateA = new Date(a.startDate.toISOString());
      const dateB = new Date(b.startDate.toISOString());
      return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    }
    if (sortBy === VacationRequestSort.END_DATE) {
      const dateA = new Date(a.endDate.toISOString());
      const dateB = new Date(b.endDate.toISOString());
      return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    }
    if (sortBy === VacationRequestSort.VACATION_TYPE) {
      return sortOrder === "asc"
        ? a.type.localeCompare(b.type)
        : b.type.localeCompare(a.type);
    }
    // if (sortBy === VacationRequestSort.STATUS) {
    //   return sortOrder === "asc"
    //     ? a.hrManagerStatus.localeCompare(b.hrManagerStatus)
    //     : b.hrManagerStatus.localeCompare(a.hrManagerStatus);
    // }
    return 0;
  });

  // /**
  //  * Handle remaining vacation days
  //  *
  //  * @param request vacation request
  //  */
  // const handleRemainingVacationDays = (request: VacationRequest) => {
  //   // TODO: These types are never going to match, p.id is forecast id, requst.personId is a keyclaok id
  //   const foundPerson = persons.find(p => p.id === request.personId);
  //   if (foundPerson) return foundPerson.unspentVacations - request.days;
  //   return null;
  // };

  /**
   * Handle request type
   *
   * @param type Vacation type
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
   * @param requestStatus Vacation request status
   */
  const handleRequestStatus = (requestStatus: VacationRequestStatuses) => {
    const statusMap = {
      [VacationRequestStatuses.PENDING]: strings.vacationRequests.pending,
      [VacationRequestStatuses.APPROVED]: strings.vacationRequests.approved,
      [VacationRequestStatuses.DECLINED]: strings.vacationRequests.declined
    };

    return statusMap[requestStatus] || "";
  };

  /**
   * Handle request status change
   * @param requestId id of vacation status request
   * @param newStatus new selected status from status types
   */
  const updateVacationRequestStatus = async (selectedStatusObject: VacationRequestStatus, newStatus: VacationRequestStatuses) => {
    // if (!person || !selectedStatusObject) {
    //   console.log("no person or selectedStatusObject");
    //   return;
    // }

    if (!selectedStatusObject) {
      return;
    }

    try {
      const updateApi = Api.getVacationRequestStatusApi(accessToken?.access_token);
      const updatedRequestStatus = await updateApi.updateVacationRequestStatus({
        id: selectedStatusObject.id!,
        statusId: selectedStatusObject.id!,
        vacationRequestStatus: {
          ...selectedStatusObject,
          status: newStatus,
          vacationRequestId: selectedStatusObject.vacationRequestId,
          createdAt: selectedStatusObject.createdAt,
          createdBy: selectedStatusObject.createdBy,
          message: selectedStatusObject.message,
          updatedAt: selectedStatusObject.updatedAt,
          updatedBy: selectedStatusObject.updatedBy
        }
      });

      const update = latestRequestStatuses.map(requestStatus => (requestStatus.id !== selectedStatusObject.id ? requestStatus : updatedRequestStatus));
      setLatestRequestStatuses(update);
    } catch (error) {
      context.setError(strings.errorHandling.fetchVacationDataFailed, error);
    }
  };

  /**
   * Handle request status on click
   *
   */
  const handleClick = (approved: boolean, requestId: string | undefined) => {
    const selectedStatusIndex = latestRequestStatuses.findIndex(s => s.vacationRequestId === requestId);
    const selectedStatusObject = latestRequestStatuses.find(s => s.vacationRequestId === requestId);
    if (approved && selectedStatusObject?.status && myRef.current) {
      selectedStatusObject.status = VacationRequestStatuses.APPROVED;
      myRef.current.className = "approved";
      updateVacationRequestStatus(selectedStatusObject, selectedStatusObject.status);
    }
    if (!approved && selectedStatusObject?.status && myRef.current) {
      selectedStatusObject.status = VacationRequestStatuses.DECLINED;
      myRef.current.className = "declined";
      updateVacationRequestStatus(selectedStatusObject, selectedStatusObject.status);
    }
    latestRequestStatuses[selectedStatusIndex] = selectedStatusObject!;

    if (approvalChanged) {
      setApprovalChanged(false);
    } else {
      setApprovalChanged(true);
    }
  };

  interface StatusTableCellProps {
    requestStatusId: string | undefined,
    requestStatus: VacationRequestStatuses,
    approvalChanged: boolean
  }
  
  /**
   * Handle request status on click
   *
   * @param type status component
   */
  function StatusTableCell(props: StatusTableCellProps) {
    const { requestStatusId, requestStatus } = props;
    const [ statusText, setStatusText ] = useState<string>(handleRequestStatus(requestStatus));

    useEffect(() => {
      setStatusText(handleRequestStatus(requestStatus));
    }, [approvalChanged]);
    return (
      <StyledTableCell
        ref={myRef}
        key={`status-${requestStatusId}`}
        sx={{ "&.pending": { color: "#FF493C" }, "&.approved": { color: "#45cf36" } }}
        className={requestStatus === "APPROVED" ? "approved" : "pending"}
      >
        { statusText }
      </StyledTableCell>
    );
  }

  return (
    <Box className={classes.employeeVacationRequests}>
      <Box>
        <Box sx={{
          float: "left", marginBottom: "10px"
        }}
        >
          <Typography variant="h2" padding={theme.spacing(2)}>
            { strings.header.requests }
          </Typography>
        </Box>
        <Box sx={{
          float: "right",
          paddingRight: "15px",
          marginBottom: "10px"
        }}
        >
          { renderVacationType() }
          { renderEmployeeSelection() }
          { renderRequestStatus() }
          <Box className={ classes.datePickers }>
            <DateRangePicker
              scope={ FilterScopes.DATE }
              dateFormat={ dateFormat }
              selectedStartDate={ selectedVacationStartDate }
              selectedEndDate={ selectedVacationEndDate }
              datePickerView={ datePickerView }
              onStartDateChange={ handleVacationStartDateChange }
              onEndDateChange={ handleVacationEndDateChange }
              onStartWeekChange={() => {
                throw new Error("Function not implemented.");
              } }
              onEndWeekChange={() => {
                throw new Error("Function not implemented.");
              } }
            />
          </Box>
        </Box>
      </Box>
      <Box>
        <TableContainer style={{ marginBottom: "10px", width: "100%" }}>
          <Table aria-label="customized table" style={{ marginBottom: "1em" }}>
            <TableHead>
              <TableRow>
                <TableCell
                  onClick={() => handleSort(VacationRequestSort.VACATION_TYPE)}
                  style={{ cursor: "pointer" }}
                >
                  {strings.header.vacationType}
                  {sortBy === VacationRequestSort.VACATION_TYPE && (
                    <Box component="span" ml={1}>
                      {sortOrder === "asc" ? (
                        <ArrowUpwardIcon fontSize="small"/>
                      ) : (
                        <ArrowDownwardIcon fontSize="small"/>
                      )}
                    </Box>
                  )}
                </TableCell>
                <TableCell
                  onClick={() => handleSort(VacationRequestSort.EMPLOYEE)}
                  style={{ cursor: "pointer" }}
                >
                  {strings.header.employee}
                  {sortBy === VacationRequestSort.EMPLOYEE && (
                    <Box component="span" ml={1}>
                      {sortOrder === "asc" ? (
                        <ArrowUpwardIcon fontSize="small"/>
                      ) : (
                        <ArrowDownwardIcon fontSize="small"/>
                      )}
                    </Box>
                  )}
                </TableCell>
                <TableCell
                  onClick={() => handleSort(VacationRequestSort.DAYS)}
                  style={{ cursor: "pointer" }}
                >
                  {strings.header.days}
                  {sortBy === VacationRequestSort.DAYS && (
                    <Box component="span" ml={1}>
                      {sortOrder === "asc" ? (
                        <ArrowUpwardIcon fontSize="small"/>
                      ) : (
                        <ArrowDownwardIcon fontSize="small"/>
                      )}
                    </Box>
                  )}
                </TableCell>
                <TableCell
                  onClick={() => handleSort(VacationRequestSort.START_DATE)}
                  style={{ cursor: "pointer" }}
                >
                  {strings.header.startDate}
                  {sortBy === VacationRequestSort.START_DATE && (
                    <Box component="span" ml={1}>
                      {sortOrder === "asc" ? (
                        <ArrowUpwardIcon fontSize="small"/>
                      ) : (
                        <ArrowDownwardIcon fontSize="small"/>
                      )}
                    </Box>
                  )}
                </TableCell>
                <TableCell
                  onClick={() => handleSort(VacationRequestSort.END_DATE)}
                  style={{ cursor: "pointer" }}
                >
                  {strings.header.endDate}
                  {sortBy === VacationRequestSort.END_DATE && (
                    <Box component="span" ml={1}>
                      {sortOrder === "asc" ? (
                        <ArrowUpwardIcon fontSize="small"/>
                      ) : (
                        <ArrowDownwardIcon fontSize="small"/>
                      )}
                    </Box>
                  )}
                </TableCell>
                <TableCell
                  onClick={() => handleSort(VacationRequestSort.REMAINING_DAYS)}
                  style={{ cursor: "pointer" }}
                >
                  {strings.header.remainingDays}
                  {sortBy === VacationRequestSort.REMAINING_DAYS && (
                    <Box component="span" ml={1}>
                      {sortOrder === "asc" ? (
                        <ArrowUpwardIcon fontSize="small"/>
                      ) : (
                        <ArrowDownwardIcon fontSize="small"/>
                      )}
                    </Box>
                  )}
                </TableCell>
                <TableCell
                  onClick={() => handleSort(VacationRequestSort.STATUS)}
                  style={{ cursor: "pointer" }}
                >
                  {strings.header.status}
                  {sortBy === VacationRequestSort.STATUS && (
                    <Box component="span" ml={1}>
                      {sortOrder === "asc" ? (
                        <ArrowUpwardIcon fontSize="small"/>
                      ) : (
                        <ArrowDownwardIcon fontSize="small"/>
                      )}
                    </Box>
                  )}
                </TableCell>
                <TableCell/>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && sortedVacationRequests.map((request: VacationRequest, index: number) => (
                <>
                  <StyledTableRow key={ request.id }>
                    <StyledTableCell component="th" scope="row">{ handleRequestType(request.type)}</StyledTableCell>
                    <StyledTableCell>{ handlePersonNames(request.personId!) }</StyledTableCell>
                    <StyledTableCell>{ request.days }</StyledTableCell>
                    <StyledTableCell>{ request.startDate.toDateString() }</StyledTableCell>
                    <StyledTableCell>{ request.endDate.toDateString() }</StyledTableCell>
                    <StyledTableCell>0</StyledTableCell>
                    {/* TODO: NEeds fixing */}
                    {/* <StyledTableCell>{ handleRemainingVacationDays(request)}</StyledTableCell> */}
                    {/* <StyledTableCell
                      sx={{ "&.pending": { color: "#FF493C" }, "&.approved": { color: "#45cf36" } }}
                      className={ request.hrManagerStatus === "APPROVED" ? "approved" : "pending"}
                    >
                      {handleRequestStatus(request.hrManagerStatus)}
                    </StyledTableCell> */}
                    {latestRequestStatuses.map((vacationRequestStatus: VacationRequestStatus) => (
                      <>
                        {request.id === vacationRequestStatus.vacationRequestId &&
                          <StatusTableCell
                            requestStatus={vacationRequestStatus.status}
                            requestStatusId={vacationRequestStatus.id}
                            approvalChanged={approvalChanged}
                          />
                        }
                      </>
                    ))}
                    <StyledTableCell>
                      <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => {
                          const newOpenRows = [...openRows];
                          newOpenRows[index] = !newOpenRows[index];
                          setOpenRows(newOpenRows);
                        }}
                      >
                        { openRows[index] ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/> }
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                  <TableRow>
                    <TableCell
                      style={{
                        paddingBottom: 0,
                        paddingTop: 0
                      }}
                      colSpan={8}
                    >
                      <Collapse
                        in={ openRows[index] }
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box sx={{ margin: 1, width: "100%" }}>
                          <Table size="small" aria-label="purchases">
                            <TableHead>
                              <TableRow>
                                <TableCell>{ strings.vacationRequests.message }</TableCell>
                                <TableCell>{ strings.vacationRequests.created }</TableCell>
                                <TableCell>{ strings.vacationRequests.updated }</TableCell>
                                <TableCell>{ strings.vacationRequests.projectManager }</TableCell>
                                <TableCell>{ strings.vacationRequests.humanResourcesManager }</TableCell>
                                <TableCell/>
                                <TableCell/>
                                <TableCell/>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow key={ request.id }>
                                <TableCell>{ request.message }</TableCell>
                                <TableCell>{ request.createdAt.toDateString() }</TableCell>
                                <TableCell>{ request.updatedAt.toDateString() }</TableCell>
                                {/* <TableCell>{ handleRequestStatus(request.projectManagerStatus) }</TableCell>
                                <TableCell>{ handleRequestStatus(request.hrManagerStatus) }</TableCell> */}
                                <TableCell/>
                                <TableCell align="right">
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    sx={{ color: "#F9473B" }}
                                    onClick={() => {
                                      handleClick(false, request.id);
                                    }}
                                  >
                                    { strings.vacationRequests.declined }
                                  </Button>
                                </TableCell>
                                <TableCell align="right">
                                  <Button
                                    variant="outlined"
                                    color="success"
                                    sx={{ color: "green" }}
                                    onClick={() => {
                                      handleClick(true, request.id);
                                    }}
                                  >
                                    { strings.vacationRequests.approved }
                                  </Button>

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

export default RenderEmployeeVacationRequests;