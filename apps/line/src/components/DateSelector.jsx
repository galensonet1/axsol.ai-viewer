import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Typography, Box, Divider } from '@mui/material';
import './DateSelector.css';

const DateSelector = ({ availableDates, selectedDate, onDateChange }) => {
  return (
    <Box className="date-selector-container">
      <Typography variant="subtitle2" className="date-selector-title">
        FECHAS DE CAPTURA
      </Typography>
      <Divider className="date-selector-divider" />
      <DatePicker
        selected={selectedDate}
        onChange={onDateChange}
        highlightDates={availableDates}
        inline
      />
    </Box>
  );
};

export default DateSelector;
