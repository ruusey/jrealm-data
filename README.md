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

### Adding static data maps
Static data maps have a predefined set of layers loaded directly from **maps.json**, useful for maps which do not require unique content on a per-generation basis. 
To create a new static map add a new entry with a unique **mapId** to **maps.json** and populate the **data** object with two entries representing the base layerr and collision
layer of your map. The base layer typically consists of scenery tiles such as walkways or grass while the collision layer typically consists of items that block the players
path such as rocks or walls
**Example: Boss_0 map:**
```
{
		"mapId": 5,
		"mapName": "Boss_0",
		"mapKey": "overworld.boss0",
		"tileSize" : 32,
		"width": 32,
		"height": 32,
		"dungeonId": -1,
		"terrainId": -1,
		"data":{
			"0": [...],
      			"1": [...]
    }
}
```
Here we have defined a tile map that is 32x32 tiles wide consisting of a base layer and collision layer. 
The dimensions of arrays '0' and '1' in the data object **MUST** match the declared dimensions of **width** and **height**

### Adding procedural terrain maps
JRealm supports procedurally generated maps using a map template system. These terrain templates are located in **terrains.json** where each entry in the list typically consists of a list of tile ids
to create the terrain out of, their rarities, and a list of enemy ids to place within that terrain.
TODO:
```
{
		"name": "World_0_Beach_0",
		"terrainId": 0,
		"width": 256,
		"height": 256,
		"tileSize": 32,
		"tileGroups": [
			{
				"ordinal": 0,
				"tileIds": [
					24,
					26,
					10,
					22,
					23,
					36,
					37
				],
				"rarities": {
					"24": 1.0,
					"26": 0.1,
					"10": 0.1,
					"22": 0.05,
					"23": 0.05,
					"36": 0.05,
					"37": 0.05
				}
			}
		],
		"enemyGroups": [
			{
				"name": "World_0_Beach_0_Enemies",
				"ordinal": 0,
				"enemyIds": [
					6,
					7,
					8,
					9,
					11,
					14,
					15
				]
			}
		]
	},
```




