import React from "react";
// import { MuiPickersUtilsProvider, KeyboardDatePicker, DatePickerView } from "@material-ui/pickers";
import { LocalizationProvider, DatePicker, CalendarPickerView } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { FilterScopes } from "types";
import { Box, TextField, MenuItem } from "@mui/material";
import TimeUtils from "utils/time-utils";
import strings from "localization/strings";
import useDateRangePickerStyles from "styles/generics/date-range-picker/date-range-picker";
import fiLocale from "date-fns/locale/fi";
import enLocale from "date-fns/locale/en-US";
import { useAppSelector } from "app/hooks";
import { selectLocale } from "features/locale/locale-slice";
import moment from "moment";

/**
 * Component properties
 */
interface Props {
  scope: FilterScopes;
  dateFormat?: string;
  selectedStartDate: Date;
  selectedEndDate: Date | null;
  startWeek?: number | null;
  endWeek?: number | null;
  datePickerView: CalendarPickerView;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onStartWeekChange: (weekNumber: number) => void;
  onEndWeekChange: (weekNumber: number) => void;
}

/**
 * Overview chart component
 */
const DateRangePicker: React.FC<Props> = ({
  scope,
  dateFormat,
  selectedStartDate,
  selectedEndDate,
  startWeek,
  endWeek,
  datePickerView,
  onStartDateChange,
  onEndDateChange,
  onStartWeekChange,
  onEndWeekChange
}) => {
  const classes = useDateRangePickerStyles();

  const { locale } = useAppSelector(selectLocale);

  const [ todayDate /* setTodayDate */ ] = React.useState(new Date());
  const [ currentWeekNumber, setCurrentWeekNumber ] = React.useState(0);
  const [ pickerLocale, setPickerLocale ] = React.useState(enLocale);

  /**
   * Initialize the date data
   */
  const initializeData = async () => {
    const currentWeek = TimeUtils.getCurrentWeek();
    setCurrentWeekNumber(currentWeek);
  };

  React.useEffect(() => {
    initializeData();
  }, []);

  React.useEffect(() => {
    locale === "fi" ? setPickerLocale(fiLocale) : setPickerLocale(enLocale);
  }, [locale]);

  /**
   * Event handler creator for week change
   *
   * @param start is start week
   */
  const handleWeekChange = (start: boolean) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    const numberValue = Number(value);
    if (start) {
      onStartWeekChange(numberValue);
    } else {
      onEndWeekChange(numberValue);
    }
  };

  /**
   * Get max start week
   */
  const getMaxStartWeek = () => {
    return todayDate.getFullYear() === selectedStartDate.getFullYear() ? currentWeekNumber : moment(selectedStartDate).weeksInYear();
  };

  /**
   * Get max end week
   */
  const getMaxEndWeek = () => {
    return todayDate.getFullYear() === selectedEndDate?.getFullYear() ? currentWeekNumber : moment(selectedEndDate).weeksInYear();
  };

  /**
   * Renders start week numbers to select component
   */
  const renderStartWeekNumbers = () => {
    if (!selectedStartDate) {
      return;
    }

    const weekOpts = [];
    for (let week = 1; week <= getMaxStartWeek(); week++) {
      weekOpts.push((
        <MenuItem value={ week }>
          { week }
        </MenuItem>
      ));
    }

    return weekOpts;
  };

  /**
   * Renders end week numbers to select component
   */
  const renderEndWeekNumbers = () => {
    if (!selectedEndDate) {
      return;
    }

    const weekOpts = [];

    if (selectedStartDate?.getFullYear() === selectedEndDate.getFullYear() && !!startWeek) {
      for (let week = startWeek; week <= getMaxEndWeek(); week++) {
        weekOpts.push((
          <MenuItem value={ week }>
            { week }
          </MenuItem>
        ));
      }

      return weekOpts;
    }

    for (let week = 1; week <= getMaxEndWeek(); week++) {
      weekOpts.push((
        <MenuItem value={ week }>
          { week }
        </MenuItem>
      ));
    }

    return weekOpts;
  };

  /**
   * Renders start date picker 
   */
  const renderStartDatePicker = () => {
    const { filterStartingDate } = strings.editorContent;

    return (
      <LocalizationProvider dateAdapter={ AdapterDateFns } adapterLocale={ pickerLocale } >
        <DatePicker
          inputVariant="standard"
          variant="inline"
          views={[ datePickerView ]}
          format={ dateFormat }
          maxDate={ todayDate }
          label={ filterStartingDate }
          value={ selectedStartDate }
          onChange={ onStartDateChange }
          className={ classes.datePicker }
          KeyboardButtonProps={{ "aria-label": `${filterStartingDate}` }}
        />
      </LocalizationProvider>
    );
  };
  
  /**
   * Renders start year picker and week selector 
   */
  const renderStartYearPickerAndWeekSelector = () => (
    <>
      <LocalizationProvider dateAdapter={ AdapterDateFns } adapterLocale={ pickerLocale } >
        <DatePicker
          views={[ FilterScopes.YEAR ]}
          variant="inline"
          inputVariant="standard"
          format="yyyy"
          maxDate={ todayDate }
          label={ strings.editorContent.selectYearStart }
          value={ selectedStartDate }
          onChange={ onStartDateChange }
          className={ classes.yearPicker }
          KeyboardButtonProps={{ "aria-label": `${strings.editorContent.filterStartingDate}` }}
        />
      </LocalizationProvider>
      <TextField
        select
        variant="standard"
        value={ startWeek }
        onChange={ handleWeekChange(true) }
        label={ strings.editorContent.selectWeekStart }
        className={ classes.weekPicker }
      >
        { renderStartWeekNumbers() }
      </TextField>
    </>
  );

  /**
   * Renders end date picker
   */
  const renderEndDate = () => (
    <LocalizationProvider dateAdapter={ AdapterDateFns } adapterLocale={ pickerLocale } >
      <DatePicker
        inputVariant="standard"
        variant="inline"
        format={ dateFormat }
        views={ [ datePickerView ] }
        minDate={ selectedStartDate }
        maxDate={ todayDate }
        label={ strings.editorContent.filterEndingDate }
        value={ selectedEndDate }
        onChange={ onEndDateChange }
        className={ classes.datePicker }
        KeyboardButtonProps={{ "aria-label": `${strings.editorContent.filterEndingDate}` }}
      />
    </LocalizationProvider>
  );

  /**
   * Renders end year picker and week selector 
   */
  const renderEndYearPickerAndWeekSelector = () => (
    <>
      <LocalizationProvider dateAdapter={ AdapterDateFns } adapterLocale={ pickerLocale } >
        <DatePicker
          inputVariant="standard"
          variant="inline"
          views={[ FilterScopes.YEAR ]}
          format="yyyy"
          minDate={ selectedStartDate }
          maxDate={ todayDate }
          label={ strings.editorContent.selectYearEnd }
          value={ selectedEndDate }
          onChange={ onEndDateChange }
          className={ classes.yearPicker }
          KeyboardButtonProps={{ "aria-label": `${strings.editorContent.filterStartingDate}` }}
        />
      </LocalizationProvider>
      <TextField
        // TODO label when start only
        select
        variant="standard"
        id="scope-select-outlined"
        value={ endWeek }
        onChange={ handleWeekChange(false) }
        label={ strings.editorContent.selectWeekEnd }
        className={ classes.weekPicker }
      >
        { renderEndWeekNumbers() }
      </TextField>
    </>
  );

  /**
   * Renders starting datepicker or week/year selector depending on scope
   */
  const renderStartDatePickersAndWeekSelector = () => {
    return scope.toString() !== FilterScopes.WEEK ?
      renderStartDatePicker() :
      renderStartYearPickerAndWeekSelector();
  };
  
  /**
   * Renders ending datepicker/week selector depending on scope
   */
  const renderEndDatePickersAndWeekSelector = () => {
    return scope.toString() !== FilterScopes.WEEK ?
      renderEndDate() :
      renderEndYearPickerAndWeekSelector();
  };

  /**
   * Component render
   */
  return (
    <>
      <Box display="flex" alignItems="center">
        { renderStartDatePickersAndWeekSelector() }
      </Box>
      <Box ml={ 4 } display="flex" alignItems="center">
        { renderEndDatePickersAndWeekSelector() }
      </Box>
    </>
  );
};

export default DateRangePicker;