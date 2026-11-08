$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$env:ANDROID_HOME = "C:\Users\Jeetendra\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\Jeetendra\AppData\Local\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:GRADLE_USER_HOME = "C:\Users\Jeetendra\.gradle"
$env:GRADLE_OPTS = "-Dorg.gradle.parallel=false -Dorg.gradle.daemon=false"

$buildDir = "C:\MediVault-Local-Build"
$currentSrc = $PSScriptRoot

Write-Output "Syncing latest source files & node modules to local build directory..."
Copy-Item -Path "$currentSrc\App.js", "$currentSrc\app.json", "$currentSrc\package.json", "$currentSrc\package-lock.json" -Destination $buildDir -Force
if (Test-Path "$currentSrc\src") {
    Copy-Item -Path "$currentSrc\src" -Destination $buildDir -Recurse -Force
}
if (Test-Path "$currentSrc\assets") {
    Copy-Item -Path "$currentSrc\assets" -Destination $buildDir -Recurse -Force
}

# Sync new native node modules
if (Test-Path "$currentSrc\node_modules\expo-intent-launcher") {
    Copy-Item -Path "$currentSrc\node_modules\expo-intent-launcher" -Destination "$buildDir\node_modules" -Recurse -Force
}
if (Test-Path "$currentSrc\node_modules\expo-web-browser") {
    Copy-Item -Path "$currentSrc\node_modules\expo-web-browser" -Destination "$buildDir\node_modules" -Recurse -Force
}

$androidDir = Join-Path $buildDir "android"
$localProps = Join-Path $androidDir "local.properties"
Set-Content -Path $localProps -Value "sdk.dir=C:/Users/Jeetendra/AppData/Local/Android/Sdk`nnode.executable=C:/Program Files/nodejs/node.exe" -Force

Write-Output "Building Standalone RELEASE APK (bundled JavaScript, no dev server needed)..."
Push-Location $androidDir

# Build release APK
.\gradlew.bat assembleRelease --project-cache-dir "C:\Users\Jeetendra\.gradle_cache" --no-daemon

Pop-Location

$outputApk = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $outputApk)) {
    $outputApk = Join-Path $androidDir "app\build\outputs\apk\release\app-release-unsigned.apk"
}

$targetApk = Join-Path $currentSrc "MediVault-AI-v1.0.0.apk"

Pop-Location

if (Test-Path $outputApk) {
    Copy-Item -Path $outputApk -Destination $targetApk -Force
    Write-Output "=========================================================="
    Write-Output "✨ SUCCESS: Standalone Release APK generated at:"
    Write-Output "   $targetApk"
    Write-Output "=========================================================="
} else {
    Write-Output "ERROR: Release APK build failed or target file not found."
}
