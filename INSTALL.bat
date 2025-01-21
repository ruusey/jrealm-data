@echo off

REM Batch script to download and install Apache Maven 3.8.3, and add it to the system PATH
SET "WORK_DIR=C://JRealm"
rm -rf "%WORK_DIR%"
REM Set Maven version and download URL
set "MAVEN_VERSION=3.8.8"
mkdir "%WORK_DIR%"

REM Set MongoDB version and download URL
set "MONGO_VERSION=6.0.6"
set "MONGO_URL=https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-%MONGO_VERSION%.zip"

REM Set installation directory
set "INSTALL_DIR=%WORK_DIR%//mongodb"
REM Set data and log directories
set "DATA_DIR=%INSTALL_DIR%//data"
set "LOG_DIR=%INSTALL_DIR%//log"
set "LOG_FILE=%LOG_DIR%//mongodb.log"

REM Set MongoDB service name
set "SERVICE_NAME=MongoDBT"

REM Create necessary directories
echo Creating directories...
mkdir "%INSTALL_DIR%"
mkdir "%DATA_DIR%/db"
mkdir "%DATA_DIR%//config"
mkdir "%LOG_DIR%"
echo ^ > %LOG_FILE%
REM Download MongoDB
echo Downloading MongoDB version %MONGO_VERSION%...
powershell -Command "(New-Object System.Net.WebClient).DownloadFile('%MONGO_URL%','mongodb.zip')"

REM https://downloads.mongodb.com/compass/mongosh-2.3.8-win32-x64.zip
REM Extract MongoDB
echo Extracting MongoDB...
powershell -Command "Expand-Archive -Path mongodb.zip -DestinationPath %INSTALL_DIR%"

REM Remove the ZIP file
del mongodb.zip

REM Create a default configuration file
echo Creating default configuration file...
echo storage: > %DATA_DIR%//config//mongod.cfg
echo ^  dbPath: "%DATA_DIR%//db" >> %DATA_DIR%//config//mongod.cfg
echo systemLog: >> %DATA_DIR%//config//mongod.cfg
echo ^  destination: file >> %DATA_DIR%//config//mongod.cfg
echo ^  path: "%LOG_FILE%" >> %DATA_DIR%//config//mongod.cfg
echo ^  logAppend: true >> %DATA_DIR%//config//mongod.cfg
echo net: >> %DATA_DIR%//config//mongod.cfg
echo ^  bindIp: 127.0.0.1 >> %DATA_DIR%//config//mongod.cfg

REM Install MongoDB as a service
echo Installing MongoDB as a service...
start powershell -noexit -Command "%INSTALL_DIR%//mongodb-win32-x86_64-windows-%MONGO_VERSION%//bin//mongod.exe --config %DATA_DIR%//config//mongod.cfg --logpath %LOG_FILE%"

REM Start the MongoDB service
echo MongoDB installation complete and running as a service!

start powershell -noexit -Command "Invoke-WebRequest -Uri https://github.com/ruusey/jrealm-data/releases/latest/download/jrealm-data.jar -OutFile %WORK_DIR%//jrealm-data.jar; java -jar %WORK_DIR%//jrealm-data.jar"
start powershell -noexit -Command "Invoke-WebRequest -Uri https://github.com/ruusey/jrealm/releases/latest/download/jrealm.jar -OutFile %WORK_DIR%//jrealm.jar; java -jar %WORK_DIR%//jrealm.jar -embedded 127.0.0.1"


