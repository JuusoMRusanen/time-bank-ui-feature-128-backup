import React, { useState } from "react";
import { Paper, Typography, MenuItem, TextField, Box, Accordion, AccordionSummary, AccordionDetails, Switch, Divider } from "@material-ui/core";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { DatePickerView } from "@material-ui/pickers";
import useEditorContentStyles from "styles/editor-content/editor-content";
import { useAppSelector } from "app/hooks";
import { selectPerson } from "features/person/person-slice";
import Api from "api/api";
import strings from "localization/strings";
import theme from "theme/theme";
import TimeUtils from "utils/time-utils";
import { FilterScopes, DateFormats, WorkTimeData, WorkTimeTotalData } from "types/index";
import { TimebankControllerGetTotalRetentionEnum } from "generated/client";
import TotalChart from "components/generics/total-chart/total-chart";
import OverviewChart from "components/generics/overview-chart/overview-chart";
import WorkTimeDataUtils from "utils/work-time-data-utils";
import moment from "moment";
import DateRangePicker from "components/generics/date-range-picker/date-range-picker";

/**
 * Component properties
 */
interface Props {
}

/**
 * Application editor content component
 *
 * @param props component properties
 */
const EditorContent: React.FC<Props> = () => {

  const classes = useEditorContentStyles();

  const { person, personTotalTime } = useAppSelector(selectPerson);

  const [ startDateOnly, setStartDateOnly ] = useState(false);
  const [ scope, setScope ] = React.useState<FilterScopes>(FilterScopes.WEEK);
  const [ dateFormat, setDateFormat ] = React.useState<string | undefined>("dd/MM/yyyy");
  const [ datePickerView, setDatePickerView ] = React.useState<DatePickerView>("date");
  const [ selectedStartDate, setSelectedStartDate ] = useState<Date>(new Date());
  const [ selectedEndDate, setSelectedEndDate ] = useState<Date | null>(null);
  const [ startWeek, setStartWeek ] = React.useState<number | null>(null);
  const [ endWeek, setEndWeek ] = React.useState<number | null>(null);
  const [ isLoading, setIsLoading ] = React.useState(false);
  const [ displayedTimeData, setDisplayedTimeData ] = React.useState<WorkTimeData[] | undefined>(undefined);
  const [ displayedTotal, setDisplayedTotal ] = React.useState<WorkTimeTotalData | undefined>(undefined);

  React.useEffect(() => {
    initializeData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    updateTimeData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person, scope, startWeek, endWeek, selectedStartDate, selectedEndDate])

  /**
   * Method to handle starting date change
   *
   * @param date selected date
   */
  const handleStartDateChange = (date: Date | null) => {
    date && setSelectedStartDate(date);
  };

  /**
   * Method to handle ending date change
   *
   * @param date selected date
   */
  const handleEndDateChange = (date: Date | null) => {
    date && setSelectedEndDate(date);
  };
  
  /**
   * Method to handle starting week change
   *
   * @param event React change event 
   */
  const handleStartWeekChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setStartWeek(Number(value));
  };

  /**
   * Method to handle ending week change
   * 
   * @param event React change event
   */
  const handleEndWeekChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setEndWeek(Number(value));
  };

  /**
   * Start date only change handler
   */
  const handleStartDateOnlyChange = () => {
    setStartDateOnly(!startDateOnly);
    setEndWeek(null);
    setSelectedEndDate(null);
  };

  /**
   * Changes the presented date format according to selected scope
   *
   * @param event React change event
   */
  const handleDateFormatChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFilterScope  = event.target.value as FilterScopes;

    setScope(selectedFilterScope);
    setDatePickerView(selectedFilterScope as DatePickerView);
    setDateFormat({
      [FilterScopes.DATE]: DateFormats.DATE,
      [FilterScopes.WEEK]: DateFormats.DATE,
      [FilterScopes.MONTH]: DateFormats.MONTH,
      [FilterScopes.YEAR]: DateFormats.YEAR,
    }[selectedFilterScope]);
  };

  /**
   * Initialize the component data
   */
  const initializeData = async () => {
    setSelectedStartDate(new Date())
    const currentWeek = TimeUtils.getCurrentWeek();

    // set scope to the current sprint
    if ((currentWeek % 2) === 0) {
      setStartWeek(currentWeek - 1);
      setSelectedEndDate(new Date());
      setEndWeek(currentWeek);
    } else {
      setStartWeek(currentWeek);
      setStartDateOnly(true)
    }
  }

  /**
   * update and set the time data
   */
  const updateTimeData = async () => {
    const loadData = {
      [FilterScopes.DATE]: loadDateData,
      [FilterScopes.WEEK]: loadWeekData,
      [FilterScopes.MONTH]: loadMonthData,
      [FilterScopes.YEAR]: loadYearData
    }[scope];

    setIsLoading(true);
    await loadData();
    setIsLoading(false);
  }

  /**
   * Load the date data
   */
  const loadDateData = async () => {
    if (!person || !selectedStartDate) {
      return;
    }

    const dateEntries = await Api.getTimeBankApi().timebankControllerGetEntries({
      personId: person.id.toString(),
      after: selectedStartDate,
      before: selectedEndDate || selectedStartDate
    });

    dateEntries.sort((date1, date2) => moment(date1.date).diff(moment(date2.date)));

    const { workTimeData, workTimeTotalData } = WorkTimeDataUtils.dateEntriesPreprocess(dateEntries);

    setDisplayedTimeData(workTimeData);
    setDisplayedTotal(workTimeTotalData);
  }

  /**
   * Load the week data
   */
  const loadWeekData = async () => {
    if (!person || !startWeek || !selectedStartDate) {
      return;
    }

    const weekEntries = await Api.getTimeBankApi().timebankControllerGetTotal({
      personId: person.id.toString(),
      retention: TimebankControllerGetTotalRetentionEnum.WEEK
    });

    weekEntries.sort((entry1, entry2) => TimeUtils.WeekOrMonthComparator(entry1.id?.year!, entry1.id?.week!, entry2.id?.year!, entry2.id?.week!));

    
    const filteredWeekEntries = weekEntries.filter(
      entry => TimeUtils.WeekOrMonthInRange(
        selectedStartDate.getFullYear(),
        startWeek,
        (!selectedEndDate || !endWeek) ? selectedStartDate.getFullYear() : selectedEndDate.getFullYear(),
        (!selectedEndDate || !endWeek) ? startWeek : endWeek,
        entry.id?.year!,
        entry.id?.week!
      )
    );

    const { workTimeData, workTimeTotalData } = WorkTimeDataUtils.weekEntriesPreprocess(filteredWeekEntries);

    setDisplayedTimeData(workTimeData);
    setDisplayedTotal(workTimeTotalData);
  }

  /**
   * Load the month data
   */
  const loadMonthData = async () => {
    if (!person || !selectedStartDate) {
      return;
    }

    const monthEntries = await Api.getTimeBankApi().timebankControllerGetTotal({
      personId: person.id.toString(),
      retention: TimebankControllerGetTotalRetentionEnum.MONTH
    });

    monthEntries.sort((entry1, entry2) => TimeUtils.WeekOrMonthComparator(entry1.id?.year!, entry1.id?.month!, entry2.id?.year!, entry2.id?.month!));
      
    const filteredMonthEntries = monthEntries.filter(
      entry => TimeUtils.WeekOrMonthInRange(
        selectedStartDate.getFullYear(),
        selectedStartDate.getMonth() + 1,
        selectedEndDate ? selectedEndDate.getFullYear() : selectedStartDate.getFullYear() ,
        selectedEndDate ? selectedEndDate.getMonth() + 1: selectedStartDate.getMonth() + 1,
        entry.id?.year!,
        entry.id?.month!
      )
    );

    const { workTimeData, workTimeTotalData } = WorkTimeDataUtils.monthEntriesPreprocess(filteredMonthEntries);

    setDisplayedTimeData(workTimeData);
    setDisplayedTotal(workTimeTotalData);
  }  
  
  /**
  * Load the year data
  */
  const loadYearData = async () => {
    if (!person || !selectedStartDate) {
      return;
    }

    const yearEntries = await Api.getTimeBankApi().timebankControllerGetTotal({
      personId: person.id.toString(),
      retention: TimebankControllerGetTotalRetentionEnum.YEAR
    });

    yearEntries.sort((year1, year2) => year1.id?.year! - year2.id?.year!);

    const filteredYearEntries = yearEntries.filter(
      entry => (selectedStartDate.getFullYear() <= entry.id?.year!) && (entry.id?.year! <= (selectedEndDate || selectedStartDate).getFullYear())
    );

    const { workTimeData, workTimeTotalData } = WorkTimeDataUtils.yearEntriesPreprocess(filteredYearEntries);

    setDisplayedTimeData(workTimeData);
    setDisplayedTotal(workTimeTotalData);
  }

  /**
   * Renders scope options for select component
   */
  const renderSelectOptions = Object.values(FilterScopes).map(scope =>
    <MenuItem
      value={ scope }
      key={ scope }
    >
      { strings.editorContent[scope as keyof object] }
    </MenuItem>
  );

  /**
   * Renders the filter subtitle text
   * 
   * @param name name of the subtitle text
   * @param value value of the subtitle text
   * @param total if it's displaying the total value
   * @param positiveTotal if the total is positive
   */
  const renderFilterSubtitleText = (name: string, value: number, total: boolean, positiveTotal?: boolean) => {
    const valueColor = positiveTotal ? theme.palette.success.main : theme.palette.error.main; 
    const valueText = positiveTotal ? `+${TimeUtils.minuteToHourString(value)}` : `-${TimeUtils.minuteToHourString(value)}`;

    return (
      <>
        <Typography
          variant="h5"
          style={{ 
            marginLeft: theme.spacing(2) 
          }}
        >
          { name }
        </Typography>
        <Typography
          variant="h5"
          style={{
            color: total ? valueColor : undefined,
            marginLeft: theme.spacing(1),
            fontStyle: "italic"
          }}
        >
          { total ? valueText : TimeUtils.minuteToHourString(value) }
        </Typography>
      </>
    );
  }

  /**
   * Renders selector of filter scope
   */
  const renderSelectScope = () => (
    <TextField
      select
      variant="outlined"
      size="small"
      value={ scope }
      onChange={ handleDateFormatChange }
      className={ classes.scopeSelector }
      InputProps={{
        classes: {
          notchedOutline: classes.notchedOutline,
        }
      }}
    >
      { renderSelectOptions }
    </TextField>
  );
  /**
   * Renders the filter component
   */
  const renderFilter = () => {
    if (!person) {
      return (
        <Paper 
          elevation={ 3 }
          className={ classes.emptyFilterContainer }
        >
          <Typography style={{ fontStyle: "italic" }}>
            { strings.editorContent.userNotSelected }
          </Typography>
        </Paper>
      );
    }

    if (!personTotalTime || !displayedTotal || !displayedTimeData) {
      return (
        <Paper 
          elevation={ 3 }
          className={ classes.emptyFilterContainer }
        >
          <Typography style={{ fontStyle: "italic" }}>
            { strings.editorContent.noTimeEntries }
          </Typography>
        </Paper>
      );
    }

    let timeRangeText = ""

    switch(displayedTimeData.length) {
      case 0:
        timeRangeText = ""
        break;
      case 1:
        timeRangeText = `${displayedTimeData[0].name}`
        break;
      default:
        timeRangeText = `(${displayedTimeData[0].name} - ${displayedTimeData[displayedTimeData.length - 1].name})`
        break;
    }

    return (
      <Accordion>
        <AccordionSummary
          expandIcon={ <ExpandMoreIcon /> }
          aria-controls="panel1a-content"
          className={ classes.filterSummary }
        >
          { renderFilterSummary(timeRangeText) }
        </AccordionSummary>
        <AccordionDetails className={ classes.filterContent }>
          { renderFilterDetails() }
        </AccordionDetails>
      </Accordion>
    );
  }

  /**
   * Renders the filter summary
   * 
   * @param timeRangeText time range text
   */
  const renderFilterSummary = (timeRangeText: string) => (
    <>
      <Typography variant="h4" style={{ fontWeight: 600, fontStyle: "italic" }}>
        { strings.editorContent.workTime }
      </Typography>
      <Box>
        <Typography variant="h4" style={{ color: "rgba(0, 0, 0, 0.5)", marginLeft: theme.spacing(2), fontStyle: "italic" }}>
          { timeRangeText }
        </Typography>
      </Box>
      <Box className={ classes.filterSubtitle } >
        { renderFilterSubtitleText(`${strings.logged}:`, displayedTotal!.logged || 0, false) }
        { renderFilterSubtitleText(`${strings.expected}:`, displayedTotal!.expected || 0, false) }
        { renderFilterSubtitleText(`${strings.total}:`, displayedTotal!.total, true, displayedTotal!.total >= 0) }
      </Box>
    </>
  )

  /**
   * Renders the filter details
   */
  const renderFilterDetails = () => (
    <>
      { renderSelectScope() }
      <Box className={ classes.startDateOnly }>
        <Switch
          color="secondary"
          checked={ startDateOnly }
          onChange={ handleStartDateOnlyChange }
        />
        <Typography variant="h5" style={{ paddingLeft: theme.spacing(0.5) }}>
          { strings.editorContent.startOnly }
        </Typography>
      </Box>
      <Box className={ classes.datePickers }>
        <DateRangePicker
          scope={ scope }
          dateFormat={ dateFormat }
          selectedStartDate={ selectedStartDate }
          selectedEndDate={ selectedEndDate }
          startWeek={ startWeek }
          endWeek={ endWeek }
          startDateOnly={ startDateOnly }
          datePickerView={ datePickerView }
          onStartDateChange={ handleStartDateChange }
          onEndDateChange={ handleEndDateChange }
          onDateFormatChange={ handleDateFormatChange }
          onStartWeekChange={ handleStartWeekChange }
          onEndWeekChange={ handleEndWeekChange }
        />
      </Box>
    </>
  )

  /**
   * Renders the filter component
   */
  const renderCharts = () => {
    if (!personTotalTime) {
      return null;
    }

    return (
      <Paper 
        elevation={ 3 }
        className={ classes.chartsContainer }
      >
        { renderOverview() }
        <Divider/>
        { renderTotal() }
      </Paper>
    );
  }

  /**
   * Renders the overview chart
   */
  const renderOverview = () => {
    if (!displayedTimeData) {
      return;
    }

    return (
      <Box className={ classes.overViewContainer }>
        <Typography variant="h2">
          { strings.editorContent.overview }
        </Typography>
        <Box className={ classes.overViewChartContainer }>
          <OverviewChart
            displayedData={ displayedTimeData }
            isLoading={ isLoading }
          />
        </Box>
      </Box>
    );
  }

  /**
   * Renders the total chart
   */
  const renderTotal = () => {
    if (!displayedTotal) {
      return;
    }

    return (
      <Box className={ classes.totalContainer }>
        <Typography variant="h2">
          { strings.editorContent.total }
        </Typography>
        <Box className={ classes.totalChartContainer }>
          <TotalChart
            displayedData={ displayedTotal }
            isLoading={ isLoading }
          />
        </Box>
      </Box>
    );
  }

  /**
   * Component render
   */
  return (
    <>
      { renderFilter() }
      { renderCharts() }
    </>
  );
}

export default EditorContent;
