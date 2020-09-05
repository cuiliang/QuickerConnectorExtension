#
# remove key from manifest.json and create .zip file
#

$manifeset = (Get-Content ".\src\manifest.json") | ConvertFrom-Json 
$ver = $manifeset.version



# create temp folder
Copy-Item ".\src" -Destination ".\temp"  -Recurse

# remove key from manifest.json
get-content ".\src\manifest.json" | select-string -pattern 'key' -notmatch | Out-File -FilePath .\temp\manifest.json -Encoding utf8

# create file for publish to web store
Remove-Item ".\temp\manifest-firefox.json"
Compress-Archive -Path ".\temp\*" -DestinationPath ".\dist\QuickerConnector_publish_$ver.zip" -Force

#firefox version
$manifesetFirefox = (Get-Content ".\src\manifest-firefox.json") | ConvertFrom-Json 
$ver = $manifesetFirefox.version
Copy-Item ".\src\manifest-firefox.json" ".\temp\manifest.json"
Compress-Archive -Path ".\temp\*" -DestinationPath ".\dist\QuickerConnector_firefox_$ver.zip" -Force

# create file for local use
# Compress-Archive -Path ".\src\*" -DestinationPath ".\dist\QuickerConnector_Local_$ver.zip" -Force

# delete temp folder
Remove-Item ".\temp" -Recurse

#read-host “Press ENTER to continue...”
