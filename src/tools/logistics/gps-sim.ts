/**
 * GPS SIM Tracking Tool
 * 
 * Track vehicles via IoT SIM-enabled GPS devices
 * 
 * POPULAR PROVIDERS IN INDIA:
 * ┌────────────────┬─────────────────┬───────────────┐
 * │ Provider       │ API Available   │ Cost/Month    │
 * ├────────────────┼─────────────────┼───────────────┤
 * │ Jio IoT        │ ✅ Yes          │ ₹49-99/SIM    │
 * │ Airtel IoT     │ ✅ Yes          │ ₹50-100/SIM   │
 * │ Vi M2M         │ ✅ Yes          │ ₹60-120/SIM   │
 * │ BSNL M2M       │ ✅ Yes          │ ₹30-60/SIM    │
 * ├────────────────┼─────────────────┼───────────────┤
 * │ GPS DEVICE VENDORS                              │
 * ├────────────────┼─────────────────┼───────────────┤
 * │ Concox         │ ✅ TCP/HTTP     │ ₹2000-5000    │
 * │ Teltonika      │ ✅ TCP/HTTP     │ ₹5000-15000   │
 * │ Queclink       │ ✅ TCP/HTTP     │ ₹3000-8000    │
 * │ Ruptela        │ ✅ TCP/HTTP     │ ₹4000-10000   │
 * │ Meitrack       │ ✅ TCP/HTTP     │ ₹2500-6000    │
 * │ Sinotrack      │ ✅ TCP          │ ₹1500-3000    │
 * └────────────────┴─────────────────┴───────────────┘
 * 
 * PROTOCOLS SUPPORTED:
 * - HTTP/REST (easiest)
 * - TCP Socket (raw device data)
 * - MQTT (IoT standard)
 * - CoAP (low bandwidth)
 */

import axios from 'axios';
import type { MCPTool, MCPParameter, MCPResult } from '../../types';

// GPS Data Types
export interface GPSLocation {
  device_id: string;
  imei: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  heading: number;         // 0-360 degrees
  altitude: number;
  accuracy: number;        // meters
  timestamp: Date;
  ignition: boolean;
  fuel_level?: number;     // percentage
  odometer?: number;       // km
  battery?: number;        // percentage
  gsm_signal?: number;     // 0-31
  satellites?: number;     // GPS satellites
  address?: string;        // Reverse geocoded
}

export interface GPSDevice {
  device_id: string;
  imei: string;
  sim_number: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  device_type: string;     // concox, teltonika, etc.
  status: 'online' | 'offline' | 'inactive';
  last_seen: Date;
  last_location?: GPSLocation;
}

export interface Geofence {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  center?: { lat: number; lng: number };
  radius?: number;         // meters (for circle)
  coordinates?: Array<{ lat: number; lng: number }>; // for polygon
  alerts: ('enter' | 'exit' | 'both')[];
}

export interface GPSAlert {
  type: 'geofence_enter' | 'geofence_exit' | 'overspeed' | 'idle' | 'sos' | 'low_battery' | 'tampering';
  device_id: string;
  timestamp: Date;
  location: GPSLocation;
  details: Record<string, any>;
}

export class GPSSimTool implements MCPTool {
  name = 'gps_sim';
  description = 'Track vehicles via IoT SIM-enabled GPS devices. Get real-time location, speed, history, geofence alerts.';
  
  private apiUrl: string;
  private apiKey: string;
  private provider: string;

  parameters: MCPParameter[] = [
    { 
      name: 'action', 
      type: 'string', 
      description: 'get_location, get_history, list_devices, set_geofence, get_alerts, get_route', 
      required: true 
    },
    { 
      name: 'device_id', 
      type: 'string', 
      description: 'GPS device ID or IMEI', 
      required: false 
    },
    { 
      name: 'vehicle_number', 
      type: 'string', 
      description: 'Vehicle registration number (alternative to device_id)', 
      required: false 
    },
    { 
      name: 'from', 
      type: 'string', 
      description: 'Start time for history (ISO format)', 
      required: false 
    },
    { 
      name: 'to', 
      type: 'string', 
      description: 'End time for history (ISO format)', 
      required: false 
    },
    { 
      name: 'geofence', 
      type: 'object', 
      description: 'Geofence definition { name, lat, lng, radius }', 
      required: false 
    },
  ];

  constructor(config?: { apiUrl?: string; apiKey?: string; provider?: string }) {
    this.apiUrl = config?.apiUrl || process.env.GPS_API_URL || '';
    this.apiKey = config?.apiKey || process.env.GPS_API_KEY || '';
    this.provider = config?.provider || process.env.GPS_PROVIDER || 'generic';
    
    if (!this.apiUrl) {
      console.warn('[GPSSimTool] No API URL configured. Set GPS_API_URL env var');
      console.warn('[GPSSimTool] Or use WowTruck GPS platform');
    }
  }

  async execute(params: Record<string, any>): Promise<MCPResult> {
    const startTime = Date.now();
    
    try {
      let data;
      
      switch (params.action) {
        case 'get_location':
          data = await this.getCurrentLocation(params.device_id || params.vehicle_number);
          break;
        case 'get_history':
          data = await this.getLocationHistory(
            params.device_id || params.vehicle_number,
            params.from,
            params.to
          );
          break;
        case 'list_devices':
          data = await this.listDevices();
          break;
        case 'set_geofence':
          data = await this.setGeofence(params.device_id, params.geofence);
          break;
        case 'get_alerts':
          data = await this.getAlerts(params.device_id, params.from, params.to);
          break;
        case 'get_route':
          data = await this.getRoutePlayback(
            params.device_id || params.vehicle_number,
            params.from,
            params.to
          );
          break;
        default:
          throw new Error(`Unknown action: ${params.action}. Use: get_location, get_history, list_devices, set_geofence, get_alerts, get_route`);
      }

      return {
        success: true,
        data,
        metadata: {
          tool: 'gps_sim',
          duration_ms: Date.now() - startTime,
          // provider: this.provider,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          tool: 'gps_sim',
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Get current location of a device
   */
  async getCurrentLocation(deviceId: string): Promise<GPSLocation> {
    if (!this.apiUrl) {
      // Return mock data for demo
      return this.getMockLocation(deviceId);
    }

    const response = await axios.get(`${this.apiUrl}/devices/${deviceId}/location`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    
    return this.normalizeLocation(response.data);
  }

  /**
   * Get location history
   */
  async getLocationHistory(
    deviceId: string, 
    from?: string, 
    to?: string
  ): Promise<{ device_id: string; points: GPSLocation[]; distance_km: number; duration_hours: number }> {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24h
    const toDate = to ? new Date(to) : new Date();

    if (!this.apiUrl) {
      // Mock history
      return {
        device_id: deviceId,
        points: this.getMockHistory(deviceId, fromDate, toDate),
        distance_km: 145.5,
        duration_hours: 6.5,
      };
    }

    const response = await axios.get(`${this.apiUrl}/devices/${deviceId}/history`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      params: { from: fromDate.toISOString(), to: toDate.toISOString() },
    });

    return response.data;
  }

  /**
   * List all registered devices
   */
  async listDevices(): Promise<GPSDevice[]> {
    if (!this.apiUrl) {
      return this.getMockDevices();
    }

    const response = await axios.get(`${this.apiUrl}/devices`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    return response.data;
  }

  /**
   * Set geofence for a device
   */
  async setGeofence(deviceId: string, geofence: Partial<Geofence>): Promise<Geofence> {
    if (!this.apiUrl) {
      return {
        id: `gf_${Date.now()}`,
        name: geofence.name || 'New Geofence',
        type: 'circle',
        center: geofence.center || { lat: 28.6139, lng: 77.2090 },
        radius: geofence.radius || 500,
        alerts: ['enter', 'exit'],
      };
    }

    const response = await axios.post(
      `${this.apiUrl}/devices/${deviceId}/geofences`,
      geofence,
      { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
    );

    return response.data;
  }

  /**
   * Get alerts for device
   */
  async getAlerts(deviceId?: string, from?: string, to?: string): Promise<GPSAlert[]> {
    if (!this.apiUrl) {
      return this.getMockAlerts(deviceId);
    }

    const response = await axios.get(`${this.apiUrl}/alerts`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      params: { device_id: deviceId, from, to },
    });

    return response.data;
  }

  /**
   * Get route playback with stops detection
   */
  async getRoutePlayback(
    deviceId: string, 
    from?: string, 
    to?: string
  ): Promise<{
    device_id: string;
    route: GPSLocation[];
    stops: Array<{ location: GPSLocation; duration_mins: number }>;
    summary: { distance_km: number; duration_hours: number; stops_count: number; max_speed: number };
  }> {
    const history = await this.getLocationHistory(deviceId, from, to);
    
    // Detect stops (speed = 0 for > 5 mins)
    const stops: Array<{ location: GPSLocation; duration_mins: number }> = [];
    let stopStart: GPSLocation | null = null;
    
    for (const point of history.points) {
      if (point.speed_kmh < 2) {
        if (!stopStart) stopStart = point;
      } else if (stopStart) {
        const duration = (point.timestamp.getTime() - stopStart.timestamp.getTime()) / 60000;
        if (duration > 5) {
          stops.push({ location: stopStart, duration_mins: Math.round(duration) });
        }
        stopStart = null;
      }
    }

    const maxSpeed = Math.max(...history.points.map(p => p.speed_kmh));

    return {
      device_id: deviceId,
      route: history.points,
      stops,
      summary: {
        distance_km: history.distance_km,
        duration_hours: history.duration_hours,
        stops_count: stops.length,
        max_speed: maxSpeed,
      },
    };
  }

  // ============ MOCK DATA (for demo) ============

  private getMockLocation(deviceId: string): GPSLocation {
    // Simulate Delhi-Mumbai route
    const baseLocations: Record<string, { lat: number; lng: number; city: string }> = {
      'default': { lat: 28.6139, lng: 77.2090, city: 'Delhi' },
      'DL01AB1234': { lat: 26.9124, lng: 75.7873, city: 'Jaipur' },
      'MH01CD5678': { lat: 19.0760, lng: 72.8777, city: 'Mumbai' },
      'HR55E9012': { lat: 28.4595, lng: 77.0266, city: 'Gurgaon' },
    };

    const loc = baseLocations[deviceId] || baseLocations['default'];
    
    // Add some randomness
    const lat = loc.lat + (Math.random() - 0.5) * 0.01;
    const lng = loc.lng + (Math.random() - 0.5) * 0.01;

    return {
      device_id: deviceId,
      imei: '86' + deviceId.replace(/\D/g, '').padEnd(13, '0'),
      latitude: lat,
      longitude: lng,
      speed_kmh: Math.floor(Math.random() * 80) + 20,
      heading: Math.floor(Math.random() * 360),
      altitude: 200 + Math.floor(Math.random() * 100),
      accuracy: 5 + Math.floor(Math.random() * 10),
      timestamp: new Date(),
      ignition: true,
      fuel_level: 60 + Math.floor(Math.random() * 30),
      odometer: 45000 + Math.floor(Math.random() * 1000),
      battery: 85 + Math.floor(Math.random() * 15),
      gsm_signal: 20 + Math.floor(Math.random() * 11),
      satellites: 8 + Math.floor(Math.random() * 6),
      address: `Near ${loc.city} Highway, ${loc.city}`,
    };
  }

  private getMockHistory(deviceId: string, from: Date, to: Date): GPSLocation[] {
    const points: GPSLocation[] = [];
    const intervalMs = 5 * 60 * 1000; // 5 minutes
    
    // Delhi to Jaipur simulation
    const startLat = 28.6139;
    const startLng = 77.2090;
    const endLat = 26.9124;
    const endLng = 75.7873;
    
    let currentTime = from.getTime();
    const totalTime = to.getTime() - from.getTime();
    
    while (currentTime <= to.getTime()) {
      const progress = (currentTime - from.getTime()) / totalTime;
      
      points.push({
        device_id: deviceId,
        imei: '86' + deviceId.replace(/\D/g, '').padEnd(13, '0'),
        latitude: startLat + (endLat - startLat) * progress + (Math.random() - 0.5) * 0.01,
        longitude: startLng + (endLng - startLng) * progress + (Math.random() - 0.5) * 0.01,
        speed_kmh: Math.floor(Math.random() * 60) + 40,
        heading: 225, // Southwest direction
        altitude: 200 + Math.floor(Math.random() * 50),
        accuracy: 5,
        timestamp: new Date(currentTime),
        ignition: true,
        satellites: 10,
      });
      
      currentTime += intervalMs;
    }
    
    return points;
  }

  private getMockDevices(): GPSDevice[] {
    return [
      {
        device_id: 'GPS001',
        imei: '861234567890123',
        sim_number: '9876543210',
        vehicle_number: 'DL01AB1234',
        driver_name: 'Ramesh Kumar',
        driver_phone: '9876543210',
        device_type: 'concox',
        status: 'online',
        last_seen: new Date(),
      },
      {
        device_id: 'GPS002',
        imei: '861234567890124',
        sim_number: '9876543211',
        vehicle_number: 'HR55E9012',
        driver_name: 'Suresh Singh',
        driver_phone: '9876543211',
        device_type: 'teltonika',
        status: 'online',
        last_seen: new Date(),
      },
      {
        device_id: 'GPS003',
        imei: '861234567890125',
        sim_number: '9876543212',
        vehicle_number: 'MH01CD5678',
        driver_name: 'Mahesh Patil',
        driver_phone: '9876543212',
        device_type: 'queclink',
        status: 'offline',
        last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
    ];
  }

  private getMockAlerts(deviceId?: string): GPSAlert[] {
    const alerts: GPSAlert[] = [
      {
        type: 'overspeed',
        device_id: deviceId || 'GPS001',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        location: this.getMockLocation(deviceId || 'GPS001'),
        details: { speed: 95, limit: 80 },
      },
      {
        type: 'geofence_exit',
        device_id: deviceId || 'GPS001',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        location: this.getMockLocation(deviceId || 'GPS001'),
        details: { geofence_name: 'Delhi Warehouse' },
      },
    ];
    
    return deviceId ? alerts.filter(a => a.device_id === deviceId) : alerts;
  }

  private normalizeLocation(data: any): GPSLocation {
    // Normalize different provider formats to our standard
    return {
      device_id: data.device_id || data.deviceId || data.id,
      imei: data.imei || data.IMEI,
      latitude: parseFloat(data.latitude || data.lat),
      longitude: parseFloat(data.longitude || data.lng || data.lon),
      speed_kmh: parseFloat(data.speed || data.speed_kmh || 0),
      heading: parseFloat(data.heading || data.course || data.direction || 0),
      altitude: parseFloat(data.altitude || data.alt || 0),
      accuracy: parseFloat(data.accuracy || data.hdop || 10),
      timestamp: new Date(data.timestamp || data.time || data.gps_time),
      ignition: data.ignition ?? data.acc ?? true,
      fuel_level: data.fuel_level || data.fuel,
      odometer: data.odometer || data.mileage,
      battery: data.battery || data.power,
      gsm_signal: data.gsm_signal || data.gsm,
      satellites: data.satellites || data.sats,
      address: data.address,
    };
  }
}

// Factory
export function createGPSSimTool(config?: { apiUrl?: string; apiKey?: string; provider?: string }): GPSSimTool {
  return new GPSSimTool(config);
}

// Provider-specific adapters
export const GPS_PROVIDERS = {
  // Popular GPS tracking platforms in India
  LOCONAV: {
    name: 'LocoNav',
    apiUrl: 'https://api.loconav.com/v1',
    docs: 'https://loconav.com/developers',
  },
  FLEETX: {
    name: 'Fleetx',
    apiUrl: 'https://api.fleetx.io/v1',
    docs: 'https://fleetx.io/api-docs',
  },
  TRACKSOLID: {
    name: 'TrackSolid (Concox)',
    apiUrl: 'https://open.tracksolidpro.com/api/v2',
    docs: 'https://www.tracksolidpro.com/open-platform',
  },
  TELTONIKA: {
    name: 'Teltonika',
    apiUrl: 'https://flespi.io/gw',
    docs: 'https://wiki.teltonika-gps.com/view/Protocols',
  },
  WIALON: {
    name: 'Wialon (Gurtam)',
    apiUrl: 'https://hst-api.wialon.com/wialon/ajax.html',
    docs: 'https://sdk.wialon.com/wiki/en/sidebar/remoteapi/remoteapi',
  },
};
