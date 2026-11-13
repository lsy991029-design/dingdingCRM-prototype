import type { ThemeConfig } from 'antd';

export const crmTheme: ThemeConfig = {
  token: {
    colorPrimary: '#007FFF',
    colorInfo: '#007FFF',
    colorLink: '#007FFF',
    colorSuccess: '#24A148',
    colorText: '#1F2329',
    colorTextSecondary: '#667085',
    colorBorder: '#E2E6ED',
    colorBgLayout: '#F5F7FA',
    borderRadius: 6,
    controlHeight: 36,
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  components: {
    Table: { headerBg: '#F6F8FB', headerColor: '#344054', borderColor: '#E5E9F0' },
    Button: { borderRadius: 6, controlHeight: 36 },
    Input: { activeBorderColor: '#007FFF', hoverBorderColor: '#80BFFF' },
    Select: { optionSelectedBg: '#EDF5FF' },
    Tabs: { itemActiveColor: '#1F2329', itemSelectedColor: '#1F2329', inkBarColor: '#1F2329' },
    Menu: { itemColor: '#4B5565', itemSelectedColor: '#007FFF', itemSelectedBg: '#EAF3FF', itemHoverColor: '#007FFF', groupTitleColor: '#98A2B3' },
    Drawer: { colorBgElevated: '#FFFFFF' },
  },
};
