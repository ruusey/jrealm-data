# JRealm-Data
### Backend Data Application for JRealm 
![alt text](https://i.imgur.com/E4MiMd5.jpg) </br>

### Running

There are no releases for JRealm Data yet as its binary size would quickly exhaust my GitHub storage so you will
need to build and run from source

0) Make sure you have Java JDK 11+ and Apache Maven 3.8.3+ installed
1) Clone this repository
2) Clone JRealm `(https://github.com/ruusey/jrealm)`
3) in /jrealm/ execute `mvn clean install` (JRealm Data has a dependency on GameData objects)
4) in /jrealm-data/ execute `mvn clean package`
5) in /jrealm-data/target execute `java -jar jrealm-data-{version}-jar`
