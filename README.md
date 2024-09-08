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

# Editing Game Data
All of JRealms data is located in the data project which exposes each .json file and sprite sheet via HTTP endpoints which the client calls at runtime to load all assets.
Game data changes for the game are expected to be performed here. There are two use cases

## 1) JSON Data
localed in `src/main/resources/data` these JSON files represent data including map tile sturcutres, game items and character class data.
Data Files:
* **character-classes.json** - List of all available classes in game including their stats, sprite sheet locations and starting equipment(TODO)
* **enemies.json** - List of all spawnable enemies including xp awarded, stats and sprite sheet locaitons
* **exp-levels.json** - Defines the games XP curve and number of charracter levels
* **game-items.json** - List of all available items including damage, stat increases and sprite locations
* **loot-groups.json** - List of all item groupings to help with enemy loot drops
* **loot-tables.json** - List of enemies loot drops including groups of loot and individual items
* **maps.json** - List of avaiable Realms and Sub-Realms including static data maps, dynamic terrain maps and dynamic dungeon maps
* **portals.json** - List of portals including their destination Realm or Sub-Realm type
* **projectile-groups.json** - List of bullet patterns used by enemies including bullet damage, magnitude, prorjectile flags and sprite information
* **terrains.json** - List of available procedural terrain type parameters including tile groups, spawn chances and enemy group configurations
* **tailes.json** - List of available tile map tiles including name, sprite location and tile data flags such as slowing and damaging
