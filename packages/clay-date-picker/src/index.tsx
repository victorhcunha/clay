/**
 * SPDX-FileCopyrightText: © 2019 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: BSD-3-Clause
 */

import Button from '@clayui/button';
import DropDown from '@clayui/drop-down';
import {ClayInput} from '@clayui/form';
import Icon from '@clayui/icon';
import {
	FocusScope,
	TInternalStateOnChange,
	useInternalState,
} from '@clayui/shared';
import React from 'react';

import DateNavigation from './DateNavigation';
import DayNumber from './DayNumber';
import DaysTable from './DaysTable';
import {formatDate, isValid, parseDate, setDate} from './Helpers';
import {useCurrentTime, useDaysSelected, useWeeks} from './Hooks';
import InputDate from './InputDate';
import TimePicker from './TimePicker';
import Weekday from './Weekday';
import WeekdayHeader from './WeekdayHeader';
import {FirstDayOfWeek, IAriaLabels, IYears} from './types';

import type {Input} from '@clayui/time-picker';

interface IProps extends React.HTMLAttributes<HTMLInputElement> {
	/**
	 * Labels for the aria attributes
	 */
	ariaLabels?: IAriaLabels;

	/**
	 * Set the format of how the date will appear in the input element.
	 * See available: https://date-fns.org/v2.14.0/docs/format
	 */
	dateFormat?: string;

	/**
	 * Flag to disable the component, buttons, open the datepicker, etc...
	 */
	disabled?: boolean;

	/**
	 * Set the first day of the week, starting from
	 * 0 (Sunday) to 6 (Saturday).
	 */
	firstDayOfWeek?: FirstDayOfWeek;

	/**
	 * Function that should return the React element to
	 * render on the datepicker footer.
	 */
	footerElement?: (object: {spritemap?: string}) => React.ReactNode;

	/**
	 * Id to be applied to the element.
	 */
	id?: string;

	/**
	 * Flag to indicate if date is initially expanded when
	 * `expand` and `onExpandChange` are not being used.
	 */
	initialExpanded?: boolean;

	/**
	 * The start date to be displayed on the calendar as "Today". Used to mark
	 * the start date of the day and when resetting.
	 */
	initialMonth?: Date;

	/**
	 * Name of the input.
	 */
	inputName?: string;

	/**
	 * The names of the months.
	 */
	months?: Array<string>;

	/**
	 * Called when the user is browsing the date picker, changing the
	 * month, year and navigating with arrows.
	 */
	onNavigation?: (data: Date) => void;

	/**
	 * Called when the input change.
	 *
	 * Second argument gives the type that caused the value change
	 */
	onValueChange: (value: string, type?: 'click' | 'input' | 'time') => void;

	/**
	 * Describe a brief tip to help users interact.
	 */
	placeholder?: string;

	/** *
	 * Flag to indicate the user will use the date-range date-picker
	 */
	range?: boolean;

	/**
	 * Path to the location of the spritemap resource.
	 */
	spritemap?: string;

	/**
	 * Flag to enable datetime selection.
	 */
	time?: boolean;

	/**
	 * Flag to indicate the timezone of the Time Picker.
	 */
	timezone?: string;

	/**
	 * Flag to indicate if 12-hour use, when true, should show am/pm input.
	 */
	use12Hours?: boolean;

	/**
	 * Flag to indicate whether to use native date picker
	 */
	useNative?: boolean;

	/**
	 * Set the value of the input.
	 */
	value: string;

	/**
	 * Short names of days of the week to use in the header
	 * of the month. It should start from Sunday.
	 */
	weekdaysShort?: Array<string>;

	/**
	 * List of years available for navigation within the selector.
	 */
	years?: IYears;

	/**
	 * Flag to indicate whether the DatePicker should validate if the year
	 * is included in the range of years. Disable only if your range is dynamic.
	 */
	yearsCheck?: boolean;

	/**
	 * Determines if menu is expanded or not
	 */
	expanded?: boolean;

	/**
	 * Callback for when dropdown changes its active state
	 */
	onExpandedChange?: TInternalStateOnChange<boolean>;
}

const DEFAULT_DATE_TIME = {
	hours: 12,
	milliseconds: 0,
	minutes: 0,
	seconds: 0,
};

const NEW_DATE = new Date();

const TIME_FORMAT = 'HH:mm';

const TIME_FORMAT_12H = 'hh:mm aa';

/**
 * ClayDatePicker component.
 */
const ClayDatePicker: React.FunctionComponent<IProps> = React.forwardRef<
	HTMLInputElement,
	IProps
>(
	(
		{
			ariaLabels = {
				buttonChooseDate: 'Choose date',
				buttonDot: 'Select current date',
				buttonNextMonth: 'Select the next month',
				buttonPreviousMonth: 'Select the previous month',
			},
			dateFormat = 'yyyy-MM-dd',
			disabled,
			expanded,
			firstDayOfWeek = FirstDayOfWeek.Sunday,
			footerElement,
			id,
			initialExpanded = false,
			initialMonth = NEW_DATE,
			inputName,
			months = [
				'January',
				'February',
				'March',
				'April',
				'May',
				'June',
				'July',
				'August',
				'September',
				'October',
				'November',
				'December',
			],
			onExpandedChange,
			onNavigation = () => {},
			onValueChange = () => {},
			placeholder,
			range,
			spritemap,
			time = false,
			timezone,
			use12Hours = false,
			useNative = false,
			value,
			weekdaysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
			years = {
				end: NEW_DATE.getFullYear(),
				start: NEW_DATE.getFullYear(),
			},
			yearsCheck = true,
			...otherProps
		}: IProps,
		ref
	) => {
		/**
		 * Indicates the current month rendered on the screen.
		 */
		const [currentMonth, setCurrentMonth] = React.useState(() =>
			// Normalize the date to always set noon to avoid time zone problems
			// and to the 1st of the month.
			setDate(initialMonth, {date: 1, ...DEFAULT_DATE_TIME})
		);

		/**
		 * DaysSelected is a tuple that represents [startDate, endDate]
		 * in the cases where We have a date range and when `range` property
		 * is disabled we will just use the first element of the tuple(startDate)
		 */
		const [daysSelected, setDaysSelected] = useDaysSelected(initialMonth);

		/**
		 * Indicates the time selected by the user.
		 */
		const [currentTime, setCurrentTime] = useCurrentTime(use12Hours);

		/**
		 * An array of the weeks and days list for the current month
		 */
		const [weeks, setWeeks] = useWeeks(currentMonth, firstDayOfWeek);

		/**
		 * Flag to indicate if date is expanded. Uses an internal state value
		 * if component is not controlled by props.
		 */
		const [expandedValue, setExpandedValue] = useInternalState({
			defaultName: 'initialExpanded',
			handleName: 'onExpandedChange',
			initialValue: initialExpanded,
			name: 'expanded',
			onChange: onExpandedChange,
			value: expanded,
		});

		/**
		 * Create a ref to store the datepicker DOM element
		 */
		const dropdownContainerRef = React.useRef<HTMLDivElement | null>(null);

		/**
		 * Create a ref to store the datepicker DOM element
		 */
		const triggerElementRef = React.useRef<HTMLDivElement | null>(null);

		/**
		 * Handles the change of the current month of the Date Picker
		 * content and takes care of updating the weeks.
		 */
		const changeMonth = (date: Date) => {
			const dateNormalized = setDate(date, {
				date: 1,
				...DEFAULT_DATE_TIME,
			});

			setCurrentMonth(dateNormalized);
			onNavigation(dateNormalized);

			// It is not necessary to update the weeks when the native
			// date is enabled. Unnecessary rendering and processing.
			if (!useNative) {
				setWeeks(dateNormalized);
			}
		};

		/**
		 * Handles the click on element of the day
		 */
		const handleDayClicked = (date: Date) => {
			const [startDate, endDate] = daysSelected;

			let newDaysSelected: [Date, Date];
			let daysSelectedToString;

			if (range) {
				if (startDate !== endDate) {
					newDaysSelected = [date, date];
				} else if (date < startDate) {
					newDaysSelected = [date, endDate];
				} else {
					newDaysSelected = [startDate, date];
				}

				daysSelectedToString = fromRangeToString(
					newDaysSelected,
					dateFormat
				);

				const [newStartDate, newEndDate] = newDaysSelected;

				if (newStartDate.getMonth() !== newEndDate.getMonth()) {
					changeMonth(startDate);
				}
			} else {
				newDaysSelected = [date, date];

				daysSelectedToString = formatDate(date, dateFormat);

				if (time) {
					daysSelectedToString = `${daysSelectedToString} ${currentTime}`;
				}
			}

			setDaysSelected(newDaysSelected);
			onValueChange(daysSelectedToString, 'click');
		};

		/**
		 * Control the value of the input propagating with the call
		 * of `onValueChange` but does not change what the user types,
		 * if a date is valid the month of the Date Picker is changed.
		 */
		const inputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			const {value} = event.target;

			if (!value) {
				changeMonth(initialMonth);

				setDaysSelected([initialMonth, initialMonth]);

				if (time) {
					setCurrentTime('--', '--', undefined);
				}
			} else {
				const format = time
					? `${dateFormat} ${
							use12Hours ? TIME_FORMAT_12H : TIME_FORMAT
					  }`
					: dateFormat;

				const [startDate, endDate] = fromStringToRange(
					value,
					format,
					NEW_DATE
				);

				const yearFrom = startDate.getFullYear();
				const yearTo = endDate.getFullYear();

				const isValidYear = yearsCheck
					? isYearWithinYears(yearFrom, years) &&
					  isYearWithinYears(yearTo, years)
					: true;

				if (isValid(startDate) && isValid(endDate) && isValidYear) {
					changeMonth(startDate);

					setDaysSelected([startDate, endDate]);

					if (time) {
						setCurrentTime(
							startDate.getHours(),
							startDate.getMinutes(),
							use12Hours
								? (formatDate(startDate, 'a') as Input['ampm'])
								: undefined
						);
					}
				}
			}

			onValueChange(value, 'input');
		};

		/**
		 * Changes selected date to the current date. The same happens when there
		 * is no date selected.
		 */
		const handleDotClicked = () => {
			const [, endDate] = daysSelected;

			changeMonth(initialMonth);

			const newDaysSelected: [Date, Date] =
				range && endDate < initialMonth
					? [endDate, initialMonth]
					: [initialMonth, endDate];

			let dateFormatted;

			if (range) {
				dateFormatted = fromRangeToString(newDaysSelected, dateFormat);
			} else if (time) {
				dateFormatted = `${formatDate(
					initialMonth,
					dateFormat
				)} ${setCurrentTime(
					initialMonth.getHours(),
					initialMonth.getMinutes(),
					use12Hours
						? (formatDate(initialMonth, 'a') as Input['ampm'])
						: undefined
				)}`;
			} else {
				dateFormatted = formatDate(initialMonth, dateFormat);
			}

			setDaysSelected(newDaysSelected);
			onValueChange(dateFormatted);
		};

		const handleTimeChange = (
			hours: number | string,
			minutes: number | string,
			ampm?: Input['ampm']
		) => {
			const [day] = daysSelected;

			if (hours === '--' && typeof minutes === 'number') {
				hours = 0;
			}

			if (minutes === '--' && typeof hours === 'number') {
				minutes = 0;
			}

			if (value) {
				let date =
					typeof hours === 'string' && typeof minutes === 'string'
						? `${formatDate(day, dateFormat)} ${hours}:${minutes}`
						: formatDate(
								setDate(day, {hours, minutes}),
								`${dateFormat} ${TIME_FORMAT}`
						  );

				if (use12Hours) {
					date += ` ${ampm}`;
				}

				onValueChange(date, 'time');
			}

			setCurrentTime(hours, minutes, use12Hours ? ampm : undefined);
		};

		/**
		 * Handles datepicker view
		 */
		const handleCalendarButtonClicked = () =>
			setExpandedValue(!expandedValue);

		/**
		 * Handle with the focus when it's outside of the component
		 * In this case, forces the state of expanded to be false
		 */
		const handleFocus = (event: FocusEvent) => {
			if (
				dropdownContainerRef.current &&
				!dropdownContainerRef.current.contains(event.target as Node) &&
				triggerElementRef.current &&
				!triggerElementRef.current.contains(event.target as Node)
			) {
				setExpandedValue(false);
			}
		};

		React.useEffect(() => {
			document.addEventListener('focus', handleFocus, true);

			return () => {
				document.removeEventListener('focus', handleFocus, true);
			};
		}, [handleFocus]);

		return (
			<FocusScope>
				<div className="date-picker">
					<ClayInput.Group id={id} ref={triggerElementRef}>
						<ClayInput.GroupItem>
							<InputDate
								{...otherProps}
								ariaLabel={ariaLabels.input}
								disabled={disabled}
								inputName={inputName}
								onChange={inputChange}
								placeholder={placeholder}
								ref={ref}
								useNative={useNative}
								value={value}
							/>
							{!useNative && (
								<ClayInput.GroupInsetItem after>
									<Button
										aria-label={ariaLabels.buttonChooseDate}
										className="date-picker-dropdown-toggle"
										data-testid="date-button"
										disabled={disabled}
										displayType="unstyled"
										onClick={handleCalendarButtonClicked}
									>
										<Icon
											spritemap={spritemap}
											symbol="calendar"
										/>
									</Button>
								</ClayInput.GroupInsetItem>
							)}
						</ClayInput.GroupItem>
					</ClayInput.Group>

					{!useNative && (
						<DropDown.Menu
							active={expandedValue}
							alignElementRef={triggerElementRef}
							className="date-picker-dropdown-menu"
							data-testid="dropdown"
							onSetActive={setExpandedValue}
							ref={dropdownContainerRef}
						>
							<div
								aria-modal="true"
								className="date-picker-calendar"
								role="dialog"
							>
								<DateNavigation
									ariaLabels={ariaLabels}
									currentMonth={currentMonth}
									disabled={disabled}
									months={months}
									onDotClicked={handleDotClicked}
									onMonthChange={changeMonth}
									spritemap={spritemap}
									years={years}
								/>
								<div className="date-picker-calendar-body">
									<WeekdayHeader
										firstDayOfWeek={firstDayOfWeek}
										weekdaysShort={weekdaysShort}
									>
										{({key, weekday}) => (
											<Weekday
												key={key}
												weekday={weekday}
											/>
										)}
									</WeekdayHeader>
									<DaysTable weeks={weeks}>
										{({day, key}) => (
											<DayNumber
												day={day}
												daysSelected={daysSelected}
												disabled={disabled}
												key={key}
												onClick={handleDayClicked}
												range={range}
											/>
										)}
									</DaysTable>
								</div>
								{(footerElement || time) && (
									<div className="date-picker-calendar-footer">
										{time && (
											<TimePicker
												currentTime={currentTime}
												disabled={disabled}
												onTimeChange={handleTimeChange}
												spritemap={spritemap}
												timezone={timezone}
												use12Hours={use12Hours}
											/>
										)}
										{!time &&
											footerElement &&
											React.Children.only(
												footerElement({spritemap})
											)}
									</div>
								)}
							</div>
						</DropDown.Menu>
					)}
				</div>
			</FocusScope>
		);
	}
);

const RANGE_SEPARATOR = ' - ';

function isYearWithinYears(year: number, years: IYears) {
	return years.start <= year && year <= years.end;
}

function fromStringToRange(
	value: string,
	dateFormat: string,
	referenceDate: Date
): readonly [Date, Date] {
	const [startDateString, endDateString] = value.split(RANGE_SEPARATOR);

	const startDate = parseDate(startDateString, dateFormat, referenceDate);

	return [
		startDate,
		endDateString
			? parseDate(endDateString, dateFormat, referenceDate)
			: startDate,
	];
}

function fromRangeToString(range: [Date, Date], dateFormat: string) {
	const [startDate, endDate] = range;

	return `${formatDate(startDate, dateFormat)}${RANGE_SEPARATOR}${formatDate(
		endDate,
		dateFormat
	)}`;
}

ClayDatePicker.displayName = 'ClayDatePicker';

export {FirstDayOfWeek};
export default ClayDatePicker;
