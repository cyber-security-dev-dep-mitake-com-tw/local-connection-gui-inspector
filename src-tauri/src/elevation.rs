use crate::types::ElevationStatus;

pub fn check_elevation() -> ElevationStatus {
    let elevated = check_is_elevated();
    let platform = std::env::consts::OS.to_string();

    let message = if elevated {
        "Running with elevated privileges".to_string()
    } else {
        match platform.as_str() {
            "macos" => "Some features require admin privileges. Click 'Request Access' to elevate.".to_string(),
            "windows" => "Some features require administrator privileges. Click 'Run as Admin' to elevate.".to_string(),
            "linux" => "Some features require root privileges. Run with sudo for full functionality.".to_string(),
            _ => "Elevated privileges may be required for some features.".to_string(),
        }
    };

    ElevationStatus {
        is_elevated: elevated,
        platform,
        message,
    }
}

fn check_is_elevated() -> bool {
    #[cfg(target_os = "windows")]
    {
        is_elevated::is_elevated()
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("id")
            .arg("-u")
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).trim() == "0")
            .unwrap_or(false)
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("id")
            .arg("-u")
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).trim() == "0")
            .unwrap_or(false)
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        false
    }
}

#[cfg(target_os = "macos")]
pub fn request_elevation() -> bool {
    use std::process::Command;

    let result = Command::new("osascript")
        .args([
            "-e",
            r#"do shell script "echo elevated" with administrator privileges"#,
        ])
        .output();

    match result {
        Ok(output) => output.status.success(),
        Err(_) => false,
    }
}

#[cfg(target_os = "windows")]
pub fn request_elevation() -> bool {
    use std::process::Command;

    let result = Command::new("powershell")
        .args([
            "-Command",
            "Start-Process -Verb RunAs -FilePath 'cmd.exe' -ArgumentList '/c echo elevated & pause'",
        ])
        .output();

    match result {
        Ok(output) => output.status.success(),
        Err(_) => false,
    }
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn request_elevation() -> bool {
    false
}
