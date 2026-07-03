use crate::types::Layer1Info;
use crate::oui::lookup_vendor;

pub fn get_layer1_info() -> Vec<(String, Layer1Info)> {
    let mut results = Vec::new();

    if let Ok(interfaces) = netdev::get_interfaces() {
        for iface in interfaces {
            let mac = iface.mac_addr
                .map(|m| m.to_string())
                .unwrap_or_else(|| "N/A".to_string());

            let vendor = if mac != "N/A" {
                lookup_vendor(&mac)
            } else {
                "N/A".to_string()
            };

            let speed = iface.transmit_speed.or(iface.receive_speed);
            let is_up = iface.is_up();

            let interface_type = format!("{:?}", iface.if_type);

            let layer1 = Layer1Info {
                interface_type,
                mac_address: mac,
                mtu: iface.mtu.unwrap_or(0),
                speed,
                is_up,
                vendor,
            };

            results.push((iface.name.clone(), layer1));
        }
    }

    results
}
