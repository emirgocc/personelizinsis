import React from 'react';
import { Calendar } from 'react-native-calendars';

export default function CalendarPanel({ currentDate, markedDates, handleDayPress, handleMonthChange }) {
  return (
    <Calendar
      onDayPress={handleDayPress}
      markedDates={markedDates}
      markingType={'custom'}
      current={currentDate.toISOString().slice(0, 10)}
      minDate={new Date().toISOString().slice(0, 10)}
      onMonthChange={handleMonthChange}
      theme={{
        calendarBackground: '#f5f7fa',
        todayTextColor: '#1976d2',
        dayTextColor: '#222',
        textDisabledColor: '#bdbdbd',
        arrowColor: '#1976d2',
      }}
      style={{ margin: 8, borderRadius: 16, overflow: 'hidden', elevation: 2 }}
    />
  );
}
