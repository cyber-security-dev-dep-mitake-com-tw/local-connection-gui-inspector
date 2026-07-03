export interface DeviceInfo {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  layer1?: Layer1Info;
  layer2?: Layer2Info;
  layer3?: Layer3Info;
  layer4?: Layer4Info;
  layer5?: Layer5Info;
  layer6?: Layer6Info;
  layer7?: Layer7Info[];
  connections: ConnectionInfo[];
}

export interface Layer1Info {
  interface_type: string;
  mac_address: string;
  mtu: number;
  speed?: number;
  is_up: boolean;
  vendor: string;
}

export interface Layer2Info {
  mac_address: string;
  vendor: string;
  vlan_id?: number;
  arp_entries: ArpEntry[];
}

export interface ArpEntry {
  ip: string;
  mac: string;
  vendor: string;
  interface: string;
}

export interface Layer3Info {
  ipv4_addresses: string[];
  ipv6_addresses: string[];
  subnet_mask?: string;
  default_gateway?: string;
  dns_servers: string[];
  is_public: boolean;
}

export interface Layer4Info {
  connections: ConnectionInfo[];
}

export interface ConnectionInfo {
  local_addr: string;
  local_port: number;
  remote_addr: string;
  remote_port: number;
  protocol: string;
  state: string;
  pid?: number;
  process_name?: string;
  is_active: boolean;
}

export interface Layer5Info {
  tls_sessions: TlsSession[];
}

export interface TlsSession {
  remote_addr: string;
  remote_port: number;
  version: string;
  cipher: string;
  sni?: string;
}

export interface Layer6Info {
  encoding: string;
  compression?: string;
  cipher_suite?: string;
}

export interface Layer7Info {
  protocol: string;
  service: string;
  details?: string;
}

export interface NetworkSnapshot {
  devices: DeviceInfo[];
  timestamp: string;
  is_elevated: boolean;
}

export interface PingResult {
  host: string;
  ip: string;
  packets_sent: number;
  packets_received: number;
  loss_percent: number;
  min_rtt?: number;
  avg_rtt?: number;
  max_rtt?: number;
  times: number[];
}

export interface TracerouteResult {
  host: string;
  ip: string;
  hops: TracerouteHop[];
}

export interface TracerouteHop {
  ttl: number;
  ip?: string;
  hostname?: string;
  rtt: (number | null)[];
}

export interface PortScanResult {
  host: string;
  ip: string;
  open_ports: PortInfo[];
  scan_time_ms: number;
}

export interface PortInfo {
  port: number;
  state: string;
  service: string;
}

export interface PacketInfo {
  timestamp: string;
  source_ip: string;
  dest_ip: string;
  source_port?: number;
  dest_port?: number;
  protocol: string;
  length: number;
  info: string;
}

export interface ElevationStatus {
  is_elevated: boolean;
  platform: string;
  message: string;
}

export type ViewMode = "cards" | "table" | "modal" | "tree";

export type LayerKey = "layer1" | "layer2" | "layer3" | "layer4" | "layer5" | "layer6" | "layer7";

export const ALL_LAYERS: LayerKey[] = ["layer1", "layer2", "layer3", "layer4", "layer5", "layer6", "layer7"];
