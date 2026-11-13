export type AMapPoint = [number, number];

export interface AMapMapInstance {
  clearMap: () => void;
  destroy: () => void;
  setCenter: (center: AMapPoint) => void;
  setFitView: (overlays?: unknown[], immediately?: boolean, avoid?: [number, number, number, number]) => void;
  add: (overlays: unknown | unknown[]) => void;
}

export interface AMapMarkerInstance {
  on: (event: string, handler: () => void) => void;
}

export interface AMapApi {
  Map: new (container: HTMLElement, options: { zoom: number; center: AMapPoint; resizeEnable: boolean }) => AMapMapInstance;
  Marker: new (options: { position: AMapPoint; title?: string; content?: string }) => AMapMarkerInstance;
  Polyline: new (options: { path: AMapPoint[]; strokeColor: string; strokeWeight: number; strokeOpacity: number; lineJoin: string; showDir: boolean }) => unknown;
}

declare global {
  interface Window {
    AMap?: AMapApi;
    _AMapSecurityConfig?: { securityJsCode?: string };
  }
}

let amapPromise: Promise<AMapApi> | undefined;

export function loadAMap(key: string, securityJsCode?: string): Promise<AMapApi> {
  if (window.AMap) return Promise.resolve(window.AMap);
  if (amapPromise) return amapPromise;

  window._AMapSecurityConfig = securityJsCode ? { securityJsCode } : undefined;
  amapPromise = new Promise<AMapApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-amap-sdk]');
    if (existing) {
      existing.addEventListener('load', () => window.AMap ? resolve(window.AMap) : reject(new Error('高德地图 SDK 未暴露 AMap 对象')));
      existing.addEventListener('error', () => reject(new Error('高德地图 SDK 加载失败')));
      return;
    }
    const script = document.createElement('script');
    script.dataset.amapSdk = 'true';
    script.async = true;
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`;
    script.onload = () => window.AMap ? resolve(window.AMap) : reject(new Error('高德地图 SDK 未暴露 AMap 对象'));
    script.onerror = () => reject(new Error('高德地图 SDK 加载失败，请检查 Key、域名白名单和网络连接'));
    document.head.appendChild(script);
  });
  return amapPromise;
}

export function resetAMapLoader() {
  amapPromise = undefined;
}
