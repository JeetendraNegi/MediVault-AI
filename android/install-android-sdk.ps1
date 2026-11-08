$sdkDir = "C:\Users\Jeetendra\AppData\Local\Android\Sdk"
$cmdlineToolsZip = "$env:TEMP\commandlinetools.zip"
$zipUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"

Write-Output "Initializing Android SDK at $sdkDir..."

if (-not (Test-Path "$sdkDir\cmdline-tools\latest")) {
    New-Item -ItemType Directory -Force -Path "$sdkDir\cmdline-tools" | Out-Null
    Write-Output "Downloading Android Command Line Tools..."
    Invoke-WebRequest -Uri $zipUrl -OutFile $cmdlineToolsZip
    
    Write-Output "Extracting Command Line Tools..."
    Expand-Archive -Path $cmdlineToolsZip -DestinationPath "$env:TEMP\cmdline-extract" -Force
    
    New-Item -ItemType Directory -Force -Path "$sdkDir\cmdline-tools\latest" | Out-Null
    Copy-Item -Path "$env:TEMP\cmdline-extract\cmdline-tools\*" -Destination "$sdkDir\cmdline-tools\latest" -Recurse -Force
}

$sdkManager = "$sdkDir\cmdline-tools\latest\bin\sdkmanager.bat"

if (Test-Path $sdkManager) {
    Write-Output "Accepting Android SDK licenses and installing Platform 34 & Build-Tools..."
    $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
    
    # Accept licenses
    cmd /c "echo y| $sdkManager --licenses" | Out-Null
    
    # Install platform-tools, platforms;android-34, build-tools;34.0.0
    & $sdkManager "platform-tools" "platforms;android-34" "build-tools;34.0.0" --verbose
    Write-Output "SUCCESS: Android SDK Platform 34 & Build Tools successfully installed at $sdkDir!"
} else {
    Write-Output "ERROR: sdkmanager.bat not found."
}
