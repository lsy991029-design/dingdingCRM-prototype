import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Alert,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Progress,
  Segmented,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  type TableColumnsType,
} from 'antd';
import { ExportIcon, ListViewIcon, MapIcon } from '../../../shared/icons';
import customerMapMarkerUrl from '../../../assets/customer-map-marker.svg';
import { loadAMap, type AMapApi, type AMapMapInstance, type AMapPoint } from '../amap';
import { departments, fieldEmployees, getTrajectoryRows, type MileageCell, type TrajectoryListRow } from '../model';

type ViewMode = 'map' | 'list';
type RangeValue = [Dayjs, Dayjs] | null;
type QueryRange = [string, string] | null;
type ExportStatus = 'GENERATING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

const weekLabels = ['日', '一', '二', '三', '四', '五', '六'];
const defaultListRange = (): [Dayjs, Dayjs] => [dayjs().subtract(6, 'day'), dayjs()];
const initialListRange = defaultListRange();
const initialAppliedRange: [string, string] = initialListRange.map((value) => value.format('YYYY-MM-DD')) as [string, string];

const trajectoryRoutes: Record<string, AMapPoint[]> = {
  alice: [[116.3708, 39.9169], [116.3792, 39.9124], [116.3887, 39.9068], [116.3975, 39.9025]],
  'li-ming': [[116.3406, 39.9317], [116.3532, 39.9228], [116.3644, 39.9176], [116.3779, 39.9129]],
  'chen-yu': [[116.4057, 39.9315], [116.4146, 39.9226], [116.4229, 39.9118], [116.4308, 39.9033]],
  'wang-hao': [[116.3566, 39.8917], [116.3695, 39.8964], [116.3822, 39.9029], [116.3931, 39.9091]],
  'zhao-xin': [[117.1771, 39.1282], [117.1853, 39.1225], [117.1949, 39.1183], [117.2036, 39.1144]],
  'zhou-chen': [[117.1768, 39.1278], [117.1842, 39.1231], [117.1921, 39.1188]],
};

function dateLabel(date: string) {
  const value = dayjs(date);
  return `${value.format('MM-DD')} 周${weekLabels[value.day()]}`;
}

function displayMileage(cell: MileageCell) {
  return cell.kind === 'value' ? `${cell.value.toFixed(1)} km` : '0.0 km';
}

function statusCopy(status: ExportStatus) {
  return {
    GENERATING: { label: '生成中', color: 'processing' as const },
    COMPLETED: { label: '已完成', color: 'success' as const },
    FAILED: { label: '失败', color: 'error' as const },
    EXPIRED: { label: '已过期', color: 'default' as const },
  }[status];
}

export function FieldTrajectoryWorkspace() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [mapDate, setMapDate] = useState<Dayjs>(dayjs('2026-08-18'));
  const [mapEmployee, setMapEmployee] = useState('alice');
  const [range, setRange] = useState<RangeValue>(initialListRange);
  const [department, setDepartment] = useState<string>();
  const [employee, setEmployee] = useState<string>();
  const [appliedRange, setAppliedRange] = useState<QueryRange>(initialAppliedRange);
  const [rows, setRows] = useState<TrajectoryListRow[]>(() => getTrajectoryRows(initialAppliedRange![0], initialAppliedRange![1]));
  const [loading, setLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportJob, setExportJob] = useState<{ id: string; status: ExportStatus; createdAt: string }>();

  const employeeOptions = useMemo(
    () => fieldEmployees.filter((item) => !department || item.department === department).map((item) => ({ value: item.id, label: item.name })),
    [department],
  );

  const selectedEmployee = fieldEmployees.find((item) => item.id === mapEmployee);
  const appliedDates = appliedRange ? getDateList(appliedRange[0], appliedRange[1]) : [];

  const query = () => {
    if (!range) {
      message.warning('请选择时间范围后查询');
      return;
    }
    const start = range[0].format('YYYY-MM-DD');
    const end = range[1].format('YYYY-MM-DD');
    setLoading(true);
    setHasQueried(true);
    setAppliedRange([start, end]);
    window.setTimeout(() => {
      setRows(getTrajectoryRows(start, end, department, employee));
      setLoading(false);
    }, 420);
  };

  const reset = () => {
    const nextRange = defaultListRange();
    const nextAppliedRange = nextRange.map((value) => value.format('YYYY-MM-DD')) as [string, string];
    setRange(nextRange);
    setDepartment(undefined);
    setEmployee(undefined);
    setAppliedRange(nextAppliedRange);
    setRows(getTrajectoryRows(nextAppliedRange[0], nextAppliedRange[1]));
    setHasQueried(true);
  };

  const updateDepartment = (value?: string) => {
    setDepartment(value);
    if (employee && value && fieldEmployees.find((item) => item.id === employee)?.department !== value) {
      setEmployee(undefined);
      message.info('已清空不符合当前部门的员工条件');
    }
  };

  const startExport = () => {
    if (!appliedRange || !rows.length) return;
    const id = `FT-${Date.now().toString().slice(-8)}`;
    setExportJob({ id, status: 'GENERATING', createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss') });
    setExportOpen(true);
    window.setTimeout(() => {
      setExportJob((current) => current?.id === id ? { ...current, status: 'COMPLETED' } : current);
    }, 1100);
  };

  const downloadExport = () => {
    if (!appliedRange || !rows.length || exportJob?.status !== 'COMPLETED') return;
    const headers = ['员工', '部门', ...appliedDates.map(dateLabel), '合计里程'];
    const values = rows.map((row) => [row.name, row.department, ...appliedDates.map((date) => displayMileage(row.mileageByDate[date])), `${row.totalMileage.toFixed(1)} km`]);
    const csv = [headers, ...values].map((line) => line.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `外勤轨迹列表_${appliedRange[0]}-${appliedRange[1]}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    message.success('文件已下载');
  };

  return (
    <div className={`field-trajectory-workspace ${viewMode === 'map' ? 'is-map-view' : 'is-list-view'}`}>
      <Segmented
        className="field-view-switch field-view-switch-floating"
        value={viewMode}
        onChange={(value) => setViewMode(value as ViewMode)}
        options={[
          { label: '地图', value: 'map', icon: <MapIcon size={16} /> },
          { label: '列表', value: 'list', icon: <ListViewIcon size={16} /> },
        ]}
      />

      {viewMode === 'map' ? (
        <MapView date={mapDate} employee={mapEmployee} employeeName={selectedEmployee?.name || ''} onDateChange={setMapDate} onEmployeeChange={setMapEmployee} />
      ) : (
        <div className="field-list-view">
          <div className="field-list-view-heading">
            <div>
              <Typography.Title level={4}>外勤轨迹</Typography.Title>
              <Typography.Text type="secondary">按时间范围查看团队外勤里程</Typography.Text>
            </div>
          </div>
          <ListView
            range={range}
            department={department}
            employee={employee}
            employeeOptions={employeeOptions}
            appliedRange={appliedRange}
            rows={rows}
            loading={loading}
            hasQueried={hasQueried}
            onRangeChange={setRange}
            onDepartmentChange={updateDepartment}
            onEmployeeChange={setEmployee}
            onQuery={query}
            onReset={reset}
            onExport={startExport}
          />
        </div>
      )}

      <ExportDrawer open={exportOpen} job={exportJob} range={appliedRange} rows={rows} onClose={() => setExportOpen(false)} onDownload={downloadExport} onRetry={startExport} />
    </div>
  );
}

function MapView({ date, employee, employeeName, onDateChange, onEmployeeChange }: { date: Dayjs; employee: string; employeeName: string; onDateChange: (value: Dayjs) => void; onEmployeeChange: (value: string) => void }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapMapInstance | undefined>(undefined);
  const [mapState, setMapState] = useState<'config' | 'loading' | 'ready' | 'error'>('loading');
  const [mapError, setMapError] = useState('');
  const amapKey = import.meta.env.VITE_AMAP_KEY?.trim();
  const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_JS_CODE?.trim();

  useEffect(() => {
    let cancelled = false;
    if (!amapKey) {
      setMapState('config');
      return;
    }
    setMapState('loading');
    loadAMap(amapKey, securityJsCode)
      .then((AMap) => {
        if (cancelled || !mapContainerRef.current) return;
        if (!mapRef.current) {
          mapRef.current = new AMap.Map(mapContainerRef.current, {
            zoom: 12,
            center: trajectoryRoutes[employee][0],
            resizeEnable: true,
          });
        }
        drawTrajectory(AMap, mapRef.current, employee, employeeName, date);
        setMapState('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setMapState('error');
        setMapError(error instanceof Error ? error.message : '高德地图加载失败');
      });
    return () => { cancelled = true; };
  }, [amapKey, date, employee, employeeName, securityJsCode]);

  useEffect(() => () => mapRef.current?.destroy(), []);

  return (
    <section className="field-map-panel">
      <div className="field-map-toolbar">
        <div className="field-map-toolbar-heading">外勤轨迹</div>
        <div className="field-map-date-controls">
          <DatePicker className="field-map-date-picker" value={date} allowClear={false} onChange={(value) => value && onDateChange(value)} />
          <Button onClick={() => onDateChange(date.subtract(1, 'day'))}>前一天</Button>
          <Button onClick={() => onDateChange(date.add(1, 'day'))}>后一天</Button>
        </div>
        <Select className="field-map-employee-select" value={employee} onChange={onEmployeeChange} options={fieldEmployees.map((item) => ({ value: item.id, label: item.name }))} />
      </div>
      <div className="field-map-canvas" aria-label={`${date.format('YYYY年MM月DD日')} ${employeeName}外勤轨迹地图`}>
        <div ref={mapContainerRef} className="field-amap-container" />
        {mapState !== 'ready' && <div className="field-map-state">
          {mapState === 'loading' && <><Skeleton active paragraph={{ rows: 4 }} /><span>正在加载高德地图</span></>}
          {mapState === 'config' && <Empty className="field-map-empty" image={Empty.PRESENTED_IMAGE_SIMPLE} description="未配置高德地图 Key"><Typography.Text type="secondary">配置 VITE_AMAP_KEY 后将加载真实地图。</Typography.Text></Empty>}
          {mapState === 'error' && <Empty className="field-map-empty" image={Empty.PRESENTED_IMAGE_SIMPLE} description="高德地图加载失败"><Typography.Text type="secondary">{mapError}</Typography.Text></Empty>}
        </div>}
        <div className="field-map-summary">
          <span className="field-map-summary-kicker">{date.format('YYYY年MM月DD日')}</span>
          <strong>{employeeName}</strong>
          <span>{mapState === 'ready' ? '已加载演示轨迹与定位点' : '等待地图服务就绪'}</span>
        </div>
        {mapState === 'ready' && <div className="map-attribution">轨迹为原型演示数据</div>}
      </div>
    </section>
  );
}

function drawTrajectory(AMap: AMapApi, map: AMapMapInstance, employee: string, employeeName: string, date: Dayjs) {
  const path = trajectoryRoutes[employee];
  map.clearMap();
  map.setCenter(path[0]);
  const line = new AMap.Polyline({ path, strokeColor: '#007FFF', strokeWeight: 5, strokeOpacity: .88, lineJoin: 'round', showDir: true });
  const markerContent = (label: string) => `<img src="${customerMapMarkerUrl}" alt="${label}" width="32" height="40" style="display:block;transform:translate(-16px,-38px)" />`;
  const start = new AMap.Marker({ position: path[0], title: `${employeeName} ${date.format('MM月DD日')} 起点`, content: markerContent('轨迹起点') });
  const end = new AMap.Marker({ position: path[path.length - 1], title: `${employeeName} ${date.format('MM月DD日')} 终点`, content: markerContent('轨迹终点') });
  map.add([line, start, end]);
  map.setFitView([line, start, end], false, [90, 110, 90, 110]);
}

function ListView({ range, department, employee, employeeOptions, appliedRange, rows, loading, hasQueried, onRangeChange, onDepartmentChange, onEmployeeChange, onQuery, onReset, onExport }: { range: RangeValue; department?: string; employee?: string; employeeOptions: { value: string; label: string }[]; appliedRange: QueryRange; rows: TrajectoryListRow[]; loading: boolean; hasQueried: boolean; onRangeChange: (value: RangeValue) => void; onDepartmentChange: (value?: string) => void; onEmployeeChange: (value?: string) => void; onQuery: () => void; onReset: () => void; onExport: () => void }) {
  const dateColumns = appliedRange ? getDateList(appliedRange[0], appliedRange[1]) : [];
  const columns = useMemo<TableColumnsType<TrajectoryListRow>>(() => [
    { title: '员工', dataIndex: 'name', key: 'name', fixed: 'left', width: 170, render: (name: string) => <Button type="link" className="field-name-link" onClick={() => message.info(`已定位${name}的轨迹`)}>{name}</Button> },
    { title: '部门', dataIndex: 'department', key: 'department', fixed: 'left', width: 130 },
    ...dateColumns.map((date) => ({
      title: <span className="field-date-heading">{dateLabel(date)}<small>里程</small></span>,
      key: date,
      width: 118,
      render: (_: unknown, row: TrajectoryListRow) => {
        const cell = row.mileageByDate[date];
        return <span className={cell.kind === 'unavailable' ? 'field-mileage-unavailable' : 'field-mileage-value'}>{displayMileage(cell)}</span>;
      },
    })),
    { title: '合计里程', key: 'totalMileage', fixed: 'right', width: 140, render: (_: unknown, row: TrajectoryListRow) => <span className="field-total-mileage">{row.totalMileage.toFixed(1)} km</span> },
  ], [dateColumns]);

  return (
    <>
      <section className="crm-surface field-filter-panel">
        <div className="field-filter-grid">
          <label className="field-filter-item"><span>时间范围 <i>*</i></span><DatePicker.RangePicker className="field-range-picker" value={range} onChange={(value) => onRangeChange(value as RangeValue)} allowClear placeholder={['开始日期', '结束日期']} /></label>
          <label className="field-filter-item"><span>部门</span><Select className="field-department-select" allowClear value={department} onChange={onDepartmentChange} placeholder="全部部门" options={departments.map((item) => ({ value: item, label: item }))} /></label>
          <label className="field-filter-item"><span>员工</span><Select className="field-employee-select" allowClear showSearch optionFilterProp="label" value={employee} onChange={onEmployeeChange} placeholder="全部员工" options={employeeOptions} /></label>
          <div className="field-filter-actions"><Button type="primary" onClick={onQuery}>查询</Button><Button onClick={onReset}>重置</Button></div>
        </div>
      </section>

      <section className="crm-surface field-list-card">
        <div className="field-list-toolbar"><div><strong>{hasQueried ? `共 ${rows.length} 位员工` : '待查询'}</strong>{appliedRange && <span className="field-query-summary">{appliedRange[0]} 至 {appliedRange[1]}</span>}</div><Tooltip title={!rows.length ? '查询出数据后可导出' : '导出当前筛选条件下的全部授权数据'}><Button icon={<ExportIcon size={16} />} disabled={!rows.length || loading} onClick={onExport}>导出</Button></Tooltip></div>
        {loading ? <Skeleton active paragraph={{ rows: 5 }} /> : !hasQueried ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择时间范围后查询" /> : !rows.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前条件下暂无符合条件的外勤里程数据"><Button onClick={onReset}>重置筛选</Button></Empty> : <>
          <Table className="field-trajectory-table" rowKey="id" columns={columns} dataSource={rows} scroll={{ x: 760 + dateColumns.length * 118 }} pagination={{ pageSize: 5, showSizeChanger: false, showTotal: (total) => `共 ${total} 条` }} />
        </>}
      </section>
    </>
  );
}

function ExportDrawer({ open, job, range, rows, onClose, onDownload, onRetry }: { open: boolean; job?: { id: string; status: ExportStatus; createdAt: string }; range: QueryRange; rows: TrajectoryListRow[]; onClose: () => void; onDownload: () => void; onRetry: () => void }) {
  const status = job ? statusCopy(job.status) : undefined;
  return <Drawer title="导出任务" open={open} onClose={onClose} width={430} footer={job && <Space><Button onClick={onClose}>关闭</Button>{job.status === 'COMPLETED' && <Button type="primary" onClick={onDownload}>下载文件</Button>}{(job.status === 'FAILED' || job.status === 'EXPIRED') && <Button type="primary" onClick={onRetry}>重新导出</Button>}</Space>}>
    {!job ? <Empty description="暂无导出任务" /> : <div className="field-export-drawer">
      <div className="field-export-status"><Tag className="field-export-status-tag" color={status?.color}>{status?.label}</Tag><span>任务 {job.id}</span></div>
      {job.status === 'GENERATING' && <Progress percent={68} status="active" showInfo={false} />}
      {job.status === 'COMPLETED' && <Alert type="success" showIcon message="文件已生成，可以下载" />}
      {job.status === 'FAILED' && <Alert type="error" showIcon message="导出失败，请重新发起任务" />}
      {job.status === 'EXPIRED' && <Alert type="warning" showIcon message="文件已过期，请重新导出" />}
      <Descriptions column={1} size="small" className="field-export-descriptions">
        <Descriptions.Item label="导出范围">{range ? `${range[0]} 至 ${range[1]}` : '--'}</Descriptions.Item>
        <Descriptions.Item label="员工数量">{rows.length} 位</Descriptions.Item>
        <Descriptions.Item label="创建时间">{job.createdAt}</Descriptions.Item>
        <Descriptions.Item label="文件内容">员工、部门、每日里程、合计里程</Descriptions.Item>
        <Descriptions.Item label="位置字段">不包含经纬度、详细地址和轨迹点</Descriptions.Item>
      </Descriptions>
    </div>}
  </Drawer>;
}

function getDateList(startDate: string, endDate: string) {
  const dates: string[] = [];
  for (let cursor = dayjs(startDate); !cursor.isAfter(dayjs(endDate), 'day'); cursor = cursor.add(1, 'day')) dates.push(cursor.format('YYYY-MM-DD'));
  return dates;
}
