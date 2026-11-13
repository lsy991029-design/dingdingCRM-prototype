import dayjs from 'dayjs';

export type MileageCell = { kind: 'value'; value: number } | { kind: 'unavailable' };

export interface FieldEmployee {
  id: string;
  name: string;
  department: string;
  hasTrajectory: boolean;
}

export interface TrajectoryListRow extends FieldEmployee {
  mileageByDate: Record<string, MileageCell>;
  totalMileage: number;
  hasIncompleteData: boolean;
}

export const departments = ['北京一部', '北京二部', '天津分公司'];

export const fieldEmployees: FieldEmployee[] = [
  { id: 'alice', name: '李仕愉（Alice）', department: '北京一部', hasTrajectory: true },
  { id: 'li-ming', name: '李明', department: '北京一部', hasTrajectory: true },
  { id: 'chen-yu', name: '陈雨', department: '北京二部', hasTrajectory: true },
  { id: 'wang-hao', name: '王浩', department: '北京二部', hasTrajectory: true },
  { id: 'zhao-xin', name: '赵欣', department: '天津分公司', hasTrajectory: true },
  { id: 'zhou-chen', name: '周晨', department: '天津分公司', hasTrajectory: false },
];

export function datesInRange(startDate: string, endDate: string): string[] {
  const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).startOf('day');
  const dates: string[] = [];
  for (let cursor = start; !cursor.isAfter(end, 'day'); cursor = cursor.add(1, 'day')) {
    dates.push(cursor.format('YYYY-MM-DD'));
  }
  return dates;
}

function mileageFor(employeeIndex: number, date: string): MileageCell {
  const day = dayjs(date);
  if (employeeIndex === 3 && day.date() % 5 === 0) return { kind: 'unavailable' };
  if (day.day() === 0) return { kind: 'value', value: 0 };
  const raw = ((employeeIndex + 2) * 3.7 + day.date() * 1.9) % 17;
  return { kind: 'value', value: Number((raw + 2.4).toFixed(1)) };
}

export function getTrajectoryRows(startDate: string, endDate: string, department?: string, employeeId?: string): TrajectoryListRow[] {
  const dates = datesInRange(startDate, endDate);
  return fieldEmployees
    .filter((employee) => employee.hasTrajectory)
    .filter((employee) => !department || employee.department === department)
    .filter((employee) => !employeeId || employee.id === employeeId)
    .map((employee) => {
      const employeeIndex = fieldEmployees.findIndex((item) => item.id === employee.id);
      const mileageByDate = Object.fromEntries(dates.map((date) => [date, mileageFor(employeeIndex, date)]));
      const cells = Object.values(mileageByDate);
      return {
        ...employee,
        mileageByDate,
        totalMileage: Number(cells.reduce((total, cell) => total + (cell.kind === 'value' ? cell.value : 0), 0).toFixed(1)),
        hasIncompleteData: cells.some((cell) => cell.kind === 'unavailable'),
      };
    });
}
