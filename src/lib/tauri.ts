import { invoke } from "@tauri-apps/api/core";
import type {
  NetworkSnapshot,
  PingResult,
  TracerouteResult,
  PortScanResult,
  PacketInfo,
  ElevationStatus,
} from "./types";

export async function getNetworkSnapshot(): Promise<NetworkSnapshot> {
  return invoke<NetworkSnapshot>("get_network_snapshot");
}

export async function checkElevation(): Promise<ElevationStatus> {
  return invoke<ElevationStatus>("check_elevation");
}

export async function requestElevation(): Promise<boolean> {
  return invoke<boolean>("request_elevation");
}

export async function pingHost(
  host: string,
  count?: number
): Promise<PingResult> {
  return invoke<PingResult>("ping_host", { host, count });
}

export async function tracerouteHost(host: string): Promise<TracerouteResult> {
  return invoke<TracerouteResult>("traceroute_host", { host });
}

export async function portScan(
  host: string,
  ports?: number[]
): Promise<PortScanResult> {
  return invoke<PortScanResult>("port_scan", { host, ports });
}

export async function startCapture(
  interfaceName: string,
  filter?: string,
  maxPackets?: number
): Promise<string> {
  return invoke<string>("start_capture", {
    interface: interfaceName,
    filter,
    maxPackets,
  });
}

export async function stopCapture(): Promise<PacketInfo[]> {
  return invoke<PacketInfo[]>("stop_capture");
}

export async function getArpTable(): Promise<
  { ip: string; mac: string; vendor: string; interface: string }[]
> {
  return invoke("get_arp_table");
}

export async function listInterfaces(): Promise<string[]> {
  return invoke<string[]>("list_interfaces");
}
