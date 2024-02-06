# JRealm-Data
### Backend Data Application for JRealm 
![alt text](https://i.imgur.com/E4MiMd5.jpg) </br>

### Running

0) Make sure you have **MongoDB Server**, **Java JDK 11+** and **Apache Maven 3.8.3+** installed</br>
1) Create a database in MongoDB called `jrealm`
2) Clone this repository
3) Clone [JRealm](https://github.com/ruusey/jrealm)
4) in **/jrealm/** execute `mvn clean install` (JRealm Data has a dependency on GameData objects)
5) Before compiling jrealm-data, modify `/src/main/resources/account_seed.json` with your desired account information
6) in **/jrealm-data/** execute `mvn clean package`
7) in **/jrealm-data/target** execute `java -jar jrealm-data-{version}-jar`
