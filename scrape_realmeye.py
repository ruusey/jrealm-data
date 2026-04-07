"""
Assemble RealmEye monster data collected via WebFetch into structured JSON.
Data was scraped from https://www.realmeye.com/wiki/ monster pages.
"""

import json
import os
from datetime import datetime

OUTPUT_DIR = r"C:\Users\ruuse\Documents\GitHub\openrealm-data\src\main\resources\data"

# All raw data collected from RealmEye wiki pages via WebFetch
RAW_DATA = {
    "Pirate": {
        "href": "/wiki/pirate",
        "hp": 5, "def": 0, "exp": 2,
        "attacks": [
            {"damage": 4, "effects": [], "speed": 2.4, "range": 4, "comments": "single shot", "projCount": 1}
        ]
    },
    "Bandit Leader": {
        "href": "/wiki/bandit-leader",
        "hp": 280, "def": 2, "exp": 88,
        "attacks": [
            {"damage": 9, "effects": [], "speed": 6, "range": 4.8, "comments": "Blade attack", "projCount": 1},
            {"damage": 12, "effects": [], "speed": 6, "range": 2, "comments": "Red bomb with radius 2", "projCount": 1}
        ]
    },
    "Hobbit Mage": {
        "href": "/wiki/hobbit-mage",
        "hp": 200, "def": 2, "exp": 64,
        "attacks": [
            {"damage": 10, "effects": [], "speed": 1.7, "range": 5, "comments": "15 shots, 1.2s cooldown, 24 angle", "projCount": 15}
        ]
    },
    "Elf Archer": {
        "href": "/wiki/elf-archer",
        "hp": 22, "def": 2, "exp": 6,
        "attacks": [
            {"damage": 9, "effects": [], "speed": 6.5, "range": 13, "comments": "aimed shot", "projCount": 1}
        ]
    },
    "Goblin Mage": {
        "href": "/wiki/goblin-mage",
        "hp": 280, "def": 0, "exp": 78,
        "attacks": [
            {"damage": 14, "effects": [], "speed": 3.5, "range": 10.5, "comments": "Wavy shot", "projCount": 1},
            {"damage": 16, "effects": [], "speed": 7.5, "range": 12, "comments": "aimed shot", "projCount": 1}
        ]
    },
    "Snake": {
        "href": "/wiki/snake",
        "hp": 5, "def": 0, "exp": 2,
        "attacks": [
            {"damage": 4, "effects": [], "speed": 4, "range": 8, "comments": "single shot", "projCount": 1}
        ]
    },
    "Scorpion Queen": {
        "href": "/wiki/scorpion-queen",
        "hp": 100, "def": 0, "exp": 40,
        "attacks": []  # Does not attack
    },
    "Deathmage": {
        "href": "/wiki/deathmage",
        "hp": 900, "def": 11, "exp": 270,
        "attacks": [
            {"damage": 25, "effects": ["Piercing"], "speed": 8, "range": 24, "comments": "3 shots, hits multiple targets", "projCount": 3}
        ]
    },
    "Fire Sprite": {
        "href": "/wiki/fire-sprite",
        "hp": 100, "def": 0, "exp": 20,
        "attacks": [
            {"damage": 17, "effects": [], "speed": 5, "range": 20, "comments": "Orange Sprite Magic", "projCount": 1}
        ]
    },
    "Ice Sprite": {
        "href": "/wiki/ice-sprite",
        "hp": 100, "def": 0, "exp": 20,
        "attacks": [
            {"damage": 14, "effects": ["Slow"], "speed": 8, "range": 14.4, "comments": "shotgun of stars", "projCount": 1}
        ]
    },
    "Dwarf King": {
        "href": "/wiki/dwarf-king",
        "hp": 320, "def": 3, "exp": 102,
        "attacks": [
            {"damage": 16, "effects": [], "speed": 5.4, "range": 6, "comments": "aimed shot", "projCount": 1}
        ]
    },
    "Orc King": {
        "href": "/wiki/orc-king",
        "hp": 240, "def": 3, "exp": 48,
        "attacks": [
            {"damage": 27, "effects": [], "speed": 8.4, "range": 8, "comments": "aimed shot", "projCount": 1}
        ]
    },
    "Sandsman King": {
        "href": "/wiki/sandsman-king",
        "hp": 270, "def": 2, "exp": 86,
        "attacks": [
            {"damage": 15, "effects": [], "speed": 8.4, "range": 7, "comments": "aimed shot", "projCount": 1}
        ]
    },
    "Night Elf King": {
        "href": "/wiki/night-elf-king",
        "hp": 180, "def": 5, "exp": 36,
        "attacks": [
            {"damage": 40, "effects": [], "speed": 8.4, "range": 7, "comments": "Green Magic projectile", "projCount": 1}
        ]
    },
    "Ogre King": {
        "href": "/wiki/ogre-king",
        "hp": 700, "def": 7, "exp": 320,
        "attacks": [
            {"damage": 60, "effects": [], "speed": 6, "range": 6, "comments": "Blade projectile", "projCount": 1},
            {"damage": 55, "effects": [], "speed": 0, "range": 2, "comments": "Red Bomb with radius 2", "projCount": 1}
        ]
    },
    "Cyclops God": {
        "href": "/wiki/cyclops-god",
        "hp": 4500, "def": 8, "exp": 195,
        "attacks": [
            {"damage": 8, "effects": [], "speed": 0.6, "range": 2, "comments": "", "projCount": 1},
            {"damage": 15, "effects": [], "speed": 2.4, "range": 4, "comments": "", "projCount": 1},
            {"damage": 33, "effects": [], "speed": 5.4, "range": 6, "comments": "", "projCount": 1},
            {"damage": 56, "effects": [], "speed": 9.6, "range": 8, "comments": "", "projCount": 1},
            {"damage": 70, "effects": [], "speed": 13.65, "range": 6.5, "comments": "Blade projectile", "projCount": 1}
        ]
    },
    "Red Demon": {
        "href": "/wiki/red-demon",
        "hp": 7000, "def": 12, "exp": 234,
        "attacks": [
            {"damage": 100, "effects": [], "speed": 5, "range": 15, "comments": "aimed bolt", "projCount": 1},
            {"damage": 110, "effects": ["Parametric"], "speed": 0.9, "range": 9, "comments": "Parametric shots, passes cover", "projCount": 1}
        ]
    },
    "Horned Drake": {
        "href": "/wiki/horned-drake",
        "hp": 1270, "def": 4, "exp": 456,
        "attacks": [
            {"damage": 30, "effects": [], "speed": 6.5, "range": 9.75, "comments": "Fire Missile", "projCount": 1}
        ]
    },
    "Great Lizard": {
        "href": "/wiki/great-lizard",
        "hp": 500, "def": 4, "exp": 180,
        "attacks": [
            {"damage": 28, "effects": [], "speed": 6.5, "range": 11.05, "comments": "12 shots ring", "projCount": 12},
            {"damage": 15, "effects": [], "speed": 5.5, "range": 2.915, "comments": "aimed shot", "projCount": 1}
        ]
    },
    "Medusa": {
        "href": "/wiki/medusa",
        "hp": 2000, "def": 18, "exp": 200,
        "attacks": [
            {"damage": 100, "effects": [], "speed": 7, "range": 14, "comments": "5-shot spread of green bolts", "projCount": 5},
            {"damage": 150, "effects": [], "speed": 8, "range": 4, "comments": "Grenade with 3-second cooldown", "projCount": 1}
        ]
    },
    "Beholder": {
        "href": "/wiki/beholder",
        "hp": 1500, "def": 12, "exp": 200,
        "attacks": [
            {"damage": 120, "effects": ["Weak"], "speed": 7, "range": 21, "comments": "star pattern with aimed shot", "projCount": 6}
        ]
    },
    "White Demon": {
        "href": "/wiki/white-demon",
        "hp": 1000, "def": 12, "exp": 200,
        "attacks": [
            {"damage": 45, "effects": ["Armor Piercing"], "speed": 5, "range": 10, "comments": "3 bullets in wide cone", "projCount": 3}
        ]
    },
    "Sprite God": {
        "href": "/wiki/sprite-god",
        "hp": 1500, "def": 12, "exp": 200,
        "attacks": [
            {"damage": 100, "effects": [], "speed": 7, "range": 14, "comments": "4-bullet spread", "projCount": 4},
            {"damage": 0, "effects": ["Silence"], "speed": 6, "range": 14.4, "comments": "Boomerang; piercing", "projCount": 1}
        ]
    },
    "Djinn": {
        "href": "/wiki/djinn",
        "hp": 1000, "def": 12, "exp": 200,
        "attacks": [
            {"damage": 60, "effects": ["Piercing"], "speed": 6, "range": 9, "comments": "Shots hit multiple targets", "projCount": 1}
        ]
    },
    "Ghost God": {
        "href": "/wiki/ghost-god",
        "hp": 1000, "def": 12, "exp": 200,
        "attacks": [
            {"damage": 120, "effects": [], "speed": 5, "range": 13.5, "comments": "7-shot wide spread of white bolts", "projCount": 7}
        ]
    },
    "Ent God": {
        "href": "/wiki/ent-god",
        "hp": 1000, "def": 18, "exp": 200,
        "attacks": [
            {"damage": 70, "effects": ["Piercing"], "speed": 8, "range": 16, "comments": "Shots hit multiple targets", "projCount": 1}
        ]
    },
    "Slime God": {
        "href": "/wiki/slime-god",
        "hp": 1000, "def": 12, "exp": 200,
        "attacks": [
            {"damage": 80, "effects": [], "speed": 10, "range": 11, "comments": "Predictive tracking shot", "projCount": 1},
            {"damage": 0, "effects": ["Slow"], "speed": 7, "range": 14, "comments": "Single aimed black star, slow 3s", "projCount": 1}
        ]
    },
    "Lizard God": {
        "href": "/wiki/lizard-god",
        "hp": 900, "def": 12, "exp": 320,
        "attacks": [
            {"damage": 65, "effects": [], "speed": 7, "range": 11.2, "comments": "3 Green Bolts shotgun", "projCount": 3}
        ]
    },
    "Flayer God": {
        "href": "/wiki/flayer-god",
        "hp": 1400, "def": 12, "exp": 560,
        "attacks": [
            {"damage": 60, "effects": [], "speed": 5, "range": 11, "comments": "Green Magic, aimed", "projCount": 1},
            {"damage": 0, "effects": ["Silence"], "speed": 7, "range": 15.4, "comments": "Grey Star, silenced 4s", "projCount": 1}
        ]
    },
    "Flying Brain": {
        "href": "/wiki/flying-brain",
        "hp": 1000, "def": 12, "exp": 200,
        "attacks": [
            {"damage": 50, "effects": [], "speed": 12, "range": 21.6, "comments": "5 shots star pattern", "projCount": 5}
        ]
    },
    "Leviathan": {
        "href": "/wiki/leviathan",
        "hp": 2000, "def": 20, "exp": 600,
        "attacks": [
            {"damage": 70, "effects": [], "speed": 6.7, "range": 11.39, "comments": "", "projCount": 1},
            {"damage": 90, "effects": [], "speed": 8.5, "range": 15.3, "comments": "", "projCount": 1}
        ]
    },
    "Ghost King": {
        "href": "/wiki/ghost-king",
        "hp": 5000, "def": 7, "exp": 1200,
        "attacks": [
            {"damage": 50, "effects": [], "speed": 6, "range": 4.8, "comments": "White Bullet", "projCount": 1}
        ]
    },
    "Cyclops King": {
        "href": "/wiki/cyclops-king",
        "hp": 350, "def": 10, "exp": 3,
        "attacks": [
            {"damage": 60, "effects": [], "speed": 4.8, "range": 12, "comments": "aimed shot", "projCount": 1}
        ]
    },
    "Lich": {
        "href": "/wiki/lich",
        "hp": 1100, "def": 7, "exp": 1165,
        "attacks": [
            {"damage": 25, "effects": ["Piercing"], "speed": 6.5, "range": 14.3, "comments": "3 shots, hits multiple targets", "projCount": 3},
            {"damage": 60, "effects": ["Piercing"], "speed": 5, "range": 10, "comments": "4 shots, hits multiple targets", "projCount": 4}
        ]
    },
    "Ent Ancient": {
        "href": "/wiki/ent-ancient",
        "hp": 1200, "def": 15, "exp": 1200,
        "attacks": [
            {"damage": 35, "effects": [], "speed": 6, "range": 12, "comments": "Bark Bolt, 2 shots", "projCount": 2},
            {"damage": 60, "effects": [], "speed": 5, "range": 13, "comments": "Bark Bolt, 3 shots at 120 angle", "projCount": 3},
            {"damage": 100, "effects": [], "speed": 3.5, "range": 10.5, "comments": "Bark Bolt, Final Phase", "projCount": 1}
        ]
    },
    "Oasis Giant": {
        "href": "/wiki/oasis-giant",
        "hp": 3000, "def": 15, "exp": 325,
        "attacks": [
            {"damage": 70, "effects": [], "speed": 6, "range": 14.4, "comments": "Green Bolt, 4 shots", "projCount": 4}
        ]
    },
    "Phoenix Lord": {
        "href": "/wiki/phoenix-lord",
        "hp": 3000, "def": 15, "exp": 195,
        "attacks": [
            {"damage": 65, "effects": [], "speed": 6, "range": 14.4, "comments": "Fire Bolt; 5 shots aimed", "projCount": 5}
        ]
    },
    "Red Beehemoth": {
        "href": "/wiki/red-beehemoth",
        "hp": 20000, "def": 25, "exp": 20000,
        "attacks": [
            {"damage": 100, "effects": ["Armor Break"], "speed": 6, "range": 15, "comments": "Red Stinger Large, Armor Broken 4s", "projCount": 1},
            {"damage": 80, "effects": ["Armor Piercing"], "speed": 7, "range": 14, "comments": "Piercing, Armor Piercing", "projCount": 1},
            {"damage": 90, "effects": ["Unstable"], "speed": 6.5, "range": 16.25, "comments": "Red Glaive, Unstable 1.4s", "projCount": 1},
            {"damage": 75, "effects": ["Unstable", "Armor Break"], "speed": 4, "range": 16, "comments": "Red Ball, Piercing", "projCount": 1},
            {"damage": 150, "effects": ["Unstable"], "speed": 0, "range": 0, "comments": "Red Bomb", "projCount": 1}
        ]
    },
    "Cube God": {
        "href": "/wiki/cube-god",
        "hp": 45000, "def": 40, "exp": 25000,
        "attacks": [
            {"damage": 100, "effects": [], "speed": 10, "range": 24, "comments": "Dark Blue Magic", "projCount": 1},
            {"damage": 150, "effects": [], "speed": 8, "range": 20, "comments": "Blue Bolt", "projCount": 1}
        ]
    },
    "Skull Shrine": {
        "href": "/wiki/skull-shrine",
        "hp": 45000, "def": 40, "exp": 25000,
        "attacks": [
            {"damage": 100, "effects": [], "speed": 10, "range": 24, "comments": "Purple Magic, 9 shots", "projCount": 9}
        ]
    },
    "Grand Sphinx": {
        "href": "/wiki/grand-sphinx",
        "hp": 65000, "def": 25, "exp": 25000,
        "attacks": [
            {"damage": 85, "effects": ["Weak"], "speed": 8, "range": 10.8, "comments": "Piercing, passes obstacles", "projCount": 1},
            {"damage": 150, "effects": [], "speed": 5.5, "range": 10.45, "comments": "Piercing, passes obstacles", "projCount": 1},
            {"damage": 120, "effects": [], "speed": 6.7, "range": 10.72, "comments": "Piercing, passes obstacles", "projCount": 1}
        ]
    },
    "Hermit God": {
        "href": "/wiki/hermit-god",
        "hp": 55000, "def": 35, "exp": 25000,
        "attacks": [
            {"damage": 45, "effects": [], "speed": 5.5, "range": 16.5, "comments": "InkBubbles", "projCount": 1},
            {"damage": 65, "effects": [], "speed": 5.5, "range": 16.5, "comments": "OctoBlast", "projCount": 1},
            {"damage": 100, "effects": ["Piercing"], "speed": 5.5, "range": 17.6, "comments": "Deep Sea Blast", "projCount": 1}
        ]
    },
    "Lord of the Lost Lands": {
        "href": "/wiki/lord-of-the-lost-lands",
        "hp": 60000, "def": 30, "exp": 35000,
        "attacks": [
            {"damage": 95, "effects": [], "speed": 8.3, "range": 16.6, "comments": "White Beam", "projCount": 1},
            {"damage": 250, "effects": ["Bleeding"], "speed": 3.5, "range": 17.5, "comments": "Vortex, passes obstacles", "projCount": 1}
        ]
    },
    "Pentaract Tower": {
        "href": "/wiki/pentaract",
        "hp": 15000, "def": 0, "exp": 40,
        "attacks": [
            {"damage": 130, "effects": ["Slow"], "speed": 8, "range": 4, "comments": "Red Bomb with 4 tile radius", "projCount": 1},
            {"damage": 150, "effects": ["Stun"], "speed": 6, "range": 3.6, "comments": "Silver Shield, 3 shots", "projCount": 3}
        ]
    },
    "Avatar of the Forgotten King": {
        "href": "/wiki/avatar-of-the-forgotten-king",
        "hp": 125000, "def": 90, "exp": 60000,
        "attacks": [
            {"damage": 150, "effects": ["Armor Break", "Unstable"], "speed": 3, "range": 12, "comments": "Fire Spin, Piercing", "projCount": 1},
            {"damage": 170, "effects": ["Unstable"], "speed": 3, "range": 12, "comments": "Fire Blaster, Piercing", "projCount": 1},
            {"damage": 170, "effects": ["Unstable"], "speed": 2.5, "range": 23.51, "comments": "Avatar Flame Wave, Piercing, acceleration", "projCount": 1},
            {"damage": 130, "effects": ["Unstable"], "speed": 2.5, "range": 23.51, "comments": "Fire Tip, Piercing", "projCount": 1},
            {"damage": 190, "effects": [], "speed": 0, "range": 0, "comments": "Fire Ball Spinner, wavy", "projCount": 1},
            {"damage": 200, "effects": [], "speed": 6, "range": 0, "comments": "Fire Spin, turning shots", "projCount": 1}
        ]
    },
    "Dreadstump the Pirate King": {
        "href": "/wiki/dreadstump-the-pirate-king",
        "hp": 1000, "def": 6, "exp": 200,
        "attacks": [
            {"damage": 14, "effects": [], "speed": 4.5, "range": 13.5, "comments": "Gold Shot", "projCount": 1},
            {"damage": 18, "effects": [], "speed": 6, "range": 12, "comments": "Pirate Shot", "projCount": 1},
            {"damage": 22, "effects": [], "speed": 14, "range": 9.8, "comments": "Pirate Cannon Bullet", "projCount": 1},
            {"damage": 15, "effects": [], "speed": 7.5, "range": 18.75, "comments": "Pirate King Sword", "projCount": 1}
        ]
    },
    "Arachna the Spider Queen": {
        "href": "/wiki/arachna-the-spider-queen",
        "hp": 3200, "def": 4, "exp": 600,
        "attacks": [
            {"damage": 40, "effects": [], "speed": 5.6, "range": 14.56, "comments": "Piercing", "projCount": 1},
            {"damage": 75, "effects": ["Weak"], "speed": 5, "range": 15, "comments": "Piercing, Weak 5s", "projCount": 1},
            {"damage": 50, "effects": ["Bleeding"], "speed": 0, "range": 0, "comments": "Stationary spider shots, Bleeding 1.5s", "projCount": 1}
        ]
    },
    "Stheno the Snake Queen": {
        "href": "/wiki/stheno-the-snake-queen",
        "hp": 9000, "def": 19, "exp": 3000,
        "attacks": [
            {"damage": 90, "effects": ["Piercing"], "speed": 7, "range": 10.5, "comments": "2 shots, Piercing", "projCount": 2},
            {"damage": 45, "effects": ["Piercing"], "speed": 5.5, "range": 11, "comments": "Piercing", "projCount": 1},
            {"damage": 100, "effects": [], "speed": 0, "range": 2.5, "comments": "AoE grenade, 2.5 tile radius", "projCount": 1}
        ]
    },
    "Archdemon Malphas": {
        "href": "/wiki/archdemon-malphas",
        "hp": 20000, "def": 20, "exp": 6000,
        "attacks": [
            {"damage": 60, "effects": ["Armor Piercing"], "speed": 7.5, "range": 11.25, "comments": "Ignores defense, Piercing", "projCount": 1},
            {"damage": 65, "effects": ["Exposed"], "speed": 4, "range": 12, "comments": "Exposed 3s, Piercing", "projCount": 1},
            {"damage": 150, "effects": ["Piercing"], "speed": 4, "range": 16, "comments": "Piercing", "projCount": 1},
            {"damage": 110, "effects": ["Exposed"], "speed": 6, "range": 18, "comments": "Exposed 3s, Piercing", "projCount": 1},
            {"damage": 25, "effects": ["Armor Break"], "speed": 8, "range": 24, "comments": "Armor Broken 3s, Piercing", "projCount": 1}
        ]
    },
    "Septavius the Ghost God": {
        "href": "/wiki/septavius-the-ghost-god",
        "hp": 12000, "def": 12, "exp": 4000,
        "attacks": [
            {"damage": 75, "effects": ["Armor Piercing"], "speed": 8, "range": 12, "comments": "Ignores defense, Piercing", "projCount": 1},
            {"damage": 160, "effects": ["Piercing"], "speed": 4, "range": 24, "comments": "Piercing", "projCount": 1},
            {"damage": 60, "effects": ["Piercing"], "speed": 7, "range": 14, "comments": "Piercing", "projCount": 1},
            {"damage": 80, "effects": ["Piercing"], "speed": 4, "range": 16, "comments": "wavy, amplitude 1.2, frequency 3.6", "projCount": 1},
            {"damage": 100, "effects": ["Piercing"], "speed": 7, "range": 14, "comments": "Piercing", "projCount": 1},
            {"damage": 120, "effects": ["Piercing"], "speed": 10, "range": 15, "comments": "Piercing", "projCount": 1},
            {"damage": 90, "effects": ["Piercing"], "speed": 4, "range": 20, "comments": "wavy, amplitude 1.6, frequency 1.3", "projCount": 1}
        ]
    },
    "Limon the Sprite Goddess": {
        "href": "/wiki/limon-the-sprite-goddess",
        "hp": 12000, "def": 16, "exp": 2000,
        "attacks": [
            {"damage": 70, "effects": ["Piercing"], "speed": 8, "range": 18.4, "comments": "Prejudice Pulse", "projCount": 1},
            {"damage": 70, "effects": ["Piercing"], "speed": 3.5, "range": 20.78, "comments": "Orange Sprite Line, accelerates", "projCount": 1},
            {"damage": 90, "effects": ["Piercing"], "speed": 2, "range": 12, "comments": "Orange Sprite Bolt, boomerang", "projCount": 1},
            {"damage": 65, "effects": ["Piercing"], "speed": 8, "range": 8.79, "comments": "wavy, decelerates", "projCount": 1},
            {"damage": 100, "effects": ["Armor Piercing"], "speed": 9, "range": 26.21, "comments": "Rainbow Sprite Blast, decelerates", "projCount": 1},
            {"damage": 20, "effects": ["Slow"], "speed": 4, "range": 11.2, "comments": "Blue Sprite Beam, Slow 1.6s", "projCount": 1}
        ]
    },
    "Gulpord the Slime God": {
        "href": "/wiki/gulpord-the-slime-god",
        "hp": 20000, "def": 20, "exp": 8000,
        "attacks": [
            {"damage": 125, "effects": [], "speed": 10, "range": 15, "comments": "Green Slimeball, 5 shots", "projCount": 5},
            {"damage": 100, "effects": [], "speed": 10, "range": 6.9, "comments": "Sludge with deceleration", "projCount": 1},
            {"damage": 0, "effects": ["Slow"], "speed": 2, "range": 14.68, "comments": "Sharp Green Star ring attack, Slow 2s", "projCount": 1}
        ]
    },
    "Dr Terrible": {
        "href": "/wiki/dr-terrible",
        "hp": 33750, "def": 25, "exp": 6000,
        "attacks": []  # Does not attack directly; spawns turrets and throws potions
    },
    "Davy Jones": {
        "href": "/wiki/davy-jones",
        "hp": 26250, "def": 35, "exp": 15000,
        "attacks": [
            {"damage": 130, "effects": ["Bleeding"], "speed": 6.5, "range": 11.05, "comments": "Piercing, Bleeding 4s", "projCount": 1},
            {"damage": 140, "effects": ["Bleeding"], "speed": 4.5, "range": 16.2, "comments": "Piercing, boomerang, Bleeding 4s", "projCount": 1}
        ]
    },
    "Thessal the Mermaid Goddess": {
        "href": "/wiki/thessal-the-mermaid-goddess",
        "hp": 51750, "def": 60, "exp": 30000,
        "attacks": [
            {"damage": 100, "effects": ["Armor Break"], "speed": 5.5, "range": 8.8, "comments": "Thunder Swirl, Piercing, Armor Broken 4s", "projCount": 1},
            {"damage": 65, "effects": [], "speed": 7, "range": 21, "comments": "Trident, Piercing", "projCount": 1},
            {"damage": 100, "effects": [], "speed": 6, "range": 18, "comments": "Super Trident, Piercing", "projCount": 1},
            {"damage": 120, "effects": ["Weak"], "speed": 6, "range": 18, "comments": "Yellow Wall, Piercing, Weak 6s", "projCount": 1}
        ]
    },
    "Esben the Unwilling": {
        "href": "/wiki/esben-the-unwilling",
        "hp": 45000, "def": 20, "exp": 30000,
        "attacks": [
            {"damage": 70, "effects": ["Armor Piercing"], "speed": 6.5, "range": 39, "comments": "Piercing, ignores defense", "projCount": 1},
            {"damage": 120, "effects": ["Quiet", "Daze"], "speed": 5.5, "range": 33, "comments": "Grey Boomerang, Quiet 2s, Dazed 4s", "projCount": 1},
            {"damage": 60, "effects": ["Unstable"], "speed": 6, "range": 36, "comments": "Orange Sonic Bat Wave, Unstable 6s", "projCount": 1},
            {"damage": 100, "effects": ["Armor Piercing"], "speed": 6, "range": 36, "comments": "Armor Pierce Bullet, Piercing", "projCount": 1}
        ]
    },
    "Crystal Prisoner": {
        "href": "/wiki/crystal-prisoner",
        "hp": 28000, "def": 25, "exp": 5000,
        "attacks": [
            {"damage": 95, "effects": ["Silence"], "speed": 8, "range": 12, "comments": "4-armed spiral, Piercing, Silenced 4s", "projCount": 4},
            {"damage": 110, "effects": ["Unstable"], "speed": 6, "range": 10.2, "comments": "Rings, Piercing, Unstable 1s", "projCount": 8},
            {"damage": 120, "effects": ["Slow"], "speed": 6, "range": 10.2, "comments": "two-way shotguns of 3, Piercing, Slow 4s", "projCount": 6},
            {"damage": 140, "effects": [], "speed": 4.7, "range": 11.28, "comments": "Aimed waves, Piercing", "projCount": 1}
        ]
    },
    "Oryx the Mad God 1": {
        "href": "/wiki/oryx-the-mad-god",
        "hp": 80000, "def": 45, "exp": 25000,
        "attacks": [
            {"damage": 40, "effects": [], "speed": 10, "range": 20, "comments": "Minions phase 1", "projCount": 1},
            {"damage": 75, "effects": ["Slow"], "speed": 8, "range": 16, "comments": "Slow 5s", "projCount": 1},
            {"damage": 90, "effects": ["Armor Piercing"], "speed": 8, "range": 12.8, "comments": "Piercing, ignores defense", "projCount": 1},
            {"damage": 280, "effects": [], "speed": 10, "range": 8, "comments": "Gaze, Piercing", "projCount": 1},
            {"damage": 1, "effects": ["Silence"], "speed": 9, "range": 16.2, "comments": "Silenced 8s, Piercing", "projCount": 1},
            {"damage": 1, "effects": ["Weak"], "speed": 9, "range": 16.2, "comments": "Weak 8s, Piercing", "projCount": 1},
            {"damage": 210, "effects": ["Weak"], "speed": 5.5, "range": 16.5, "comments": "Superblast, Weak 4s, Piercing", "projCount": 1},
            {"damage": 100, "effects": ["Daze"], "speed": 4, "range": 12, "comments": "Star Stunner, Dazed 4s, Piercing", "projCount": 1},
            {"damage": 220, "effects": [], "speed": 8, "range": 4, "comments": "Dance AoE bombs", "projCount": 1}
        ]
    },
    "Oryx the Mad God 2": {
        "href": "/wiki/oryx-the-mad-god-2",
        "hp": 100000, "def": 60, "exp": 50000,
        "attacks": [
            {"damage": 135, "effects": [], "speed": 7, "range": 17.5, "comments": "Fire Bolt", "projCount": 1},
            {"damage": 160, "effects": ["Slow"], "speed": 7, "range": 17.5, "comments": "Green Star, Slow 5s", "projCount": 1},
            {"damage": 160, "effects": ["Unstable"], "speed": 10.5, "range": 12.6, "comments": "Blue Star, Unstable 5s", "projCount": 1},
            {"damage": 160, "effects": ["Quiet"], "speed": 4.5, "range": 13.5, "comments": "Grey Star, Quiet 3s", "projCount": 1},
            {"damage": 240, "effects": [], "speed": 10, "range": 4.5, "comments": "Blade", "projCount": 1},
            {"damage": 250, "effects": [], "speed": 4, "range": 8, "comments": "Sun Explosion, Armor Piercing, Piercing", "projCount": 1},
            {"damage": 90, "effects": ["Daze"], "speed": 4, "range": 12, "comments": "White Star Stunner, Dazed 4s, Piercing", "projCount": 1},
            {"damage": 250, "effects": [], "speed": 4.8, "range": 14.4, "comments": "White Superblast, Piercing", "projCount": 1},
            {"damage": 1, "effects": ["Quiet"], "speed": 9, "range": 16.2, "comments": "Dark Gray Spinner, Quiet 10s, Piercing", "projCount": 1},
            {"damage": 1, "effects": ["Weak"], "speed": 9, "range": 16.2, "comments": "Gray Spinner, Weak 15s, Piercing", "projCount": 1},
            {"damage": 200, "effects": [], "speed": 0, "range": 0, "comments": "Red Bomb, Radius 3", "projCount": 1}
        ]
    },
    "Marble Colossus": {
        "href": "/wiki/marble-colossus",
        "hp": 187500, "def": 50, "exp": 80000,
        "attacks": [
            {"damage": 200, "effects": ["Stun"], "speed": 8, "range": 24, "comments": "Boomerang, Amplitude 0.5, Frequency 8, Stunned 2s", "projCount": 1},
            {"damage": 100, "effects": ["Armor Piercing"], "speed": 9, "range": 10.8, "comments": "Armor Piercing, Piercing", "projCount": 1},
            {"damage": 150, "effects": ["Slow"], "speed": 6, "range": 36, "comments": "Boomerang, Slow 2.5s", "projCount": 1},
            {"damage": 300, "effects": [], "speed": 3, "range": 18.6, "comments": "Piercing", "projCount": 1},
            {"damage": 115, "effects": ["Paralyze"], "speed": 7.5, "range": 24.375, "comments": "Paralyzed 0.6s, Piercing", "projCount": 1},
            {"damage": 250, "effects": ["Unstable"], "speed": 7.5, "range": 16.5, "comments": "Unstable 3s", "projCount": 1},
            {"damage": 100, "effects": ["Unstable"], "speed": 8, "range": 64, "comments": "Parametric Magnitude 6, Unstable 2.5s, Piercing", "projCount": 1},
            {"damage": 80, "effects": ["Silence"], "speed": 10, "range": 25, "comments": "Silenced 4s, Armor Piercing, Piercing", "projCount": 1},
            {"damage": 130, "effects": ["Paralyze"], "speed": 2, "range": 16, "comments": "Paralyzed 1.2s", "projCount": 1},
            {"damage": 150, "effects": ["Paralyze"], "speed": 5, "range": 25, "comments": "Paralyzed 3s, Amplitude 0.25, Frequency 10, Piercing", "projCount": 1},
            {"damage": 150, "effects": ["Petrify"], "speed": 10, "range": 25, "comments": "Petrify 0.6s, Piercing", "projCount": 1},
            {"damage": 200, "effects": ["Silence"], "speed": 7, "range": 28, "comments": "Silenced 2s, Piercing", "projCount": 1},
            {"damage": 200, "effects": ["Armor Piercing"], "speed": 11, "range": 22, "comments": "Armor Piercing, Piercing", "projCount": 1}
        ]
    },
    "Void Entity": {
        "href": "/wiki/void-entity",
        "hp": 300000, "def": 60, "exp": 80000,
        "attacks": [
            {"damage": 175, "effects": ["Armor Piercing"], "speed": 10, "range": 25, "comments": "Ignores defense, Piercing", "projCount": 1},
            {"damage": 185, "effects": ["Paralyze"], "speed": 8, "range": 28, "comments": "Piercing", "projCount": 1},
            {"damage": 180, "effects": ["Exposed"], "speed": 8, "range": 32, "comments": "Piercing", "projCount": 1},
            {"damage": 225, "effects": ["Quiet"], "speed": 10, "range": 18, "comments": "Piercing", "projCount": 1},
            {"damage": 200, "effects": ["Unstable"], "speed": 8, "range": 16, "comments": "Piercing", "projCount": 1},
            {"damage": 175, "effects": ["Pet Stasis"], "speed": 6, "range": 15, "comments": "Piercing", "projCount": 1},
            {"damage": 175, "effects": [], "speed": 7, "range": 21, "comments": "wavy, Amplitude 1.5, Frequency 1.5", "projCount": 1},
            {"damage": 200, "effects": ["Stun"], "speed": 5, "range": 17.5, "comments": "Piercing", "projCount": 1},
            {"damage": 205, "effects": ["Slow"], "speed": 8, "range": 16, "comments": "wavy, Amplitude 2, Frequency 1.2", "projCount": 1},
            {"damage": 250, "effects": ["Silence"], "speed": 7, "range": 28, "comments": "Piercing", "projCount": 1},
            {"damage": 150, "effects": ["Petrify"], "speed": 10, "range": 25, "comments": "Piercing", "projCount": 1},
            {"damage": 300, "effects": ["Silence"], "speed": 5, "range": 30, "comments": "Piercing", "projCount": 1},
            {"damage": 425, "effects": ["Silence"], "speed": 5, "range": 30, "comments": "Piercing", "projCount": 1}
        ]
    },
}


def classify_difficulty(name, hp, exp):
    """Classify monster difficulty based on stats."""
    boss_names = [
        "Oryx the Mad God 1", "Oryx the Mad God 2", "Marble Colossus",
        "Void Entity", "Avatar of the Forgotten King"
    ]
    if name in boss_names:
        return "boss"
    if hp is not None and hp >= 30000:
        return "boss"
    elif hp is not None and hp >= 5000:
        return "high"
    elif hp is not None and hp >= 500:
        return "mid"
    else:
        return "low"


def parse_pattern(comments):
    """Extract shot pattern from comments."""
    c = comments.lower()
    if "ring" in c or "radial" in c:
        return "ring"
    elif "spread" in c or "shotgun" in c or "cone" in c:
        return "spread"
    elif "bomb" in c or "grenade" in c or "aoe" in c or "radius" in c:
        return "bomb"
    elif "boomerang" in c:
        return "boomerang"
    elif "wavy" in c or "wave" in c:
        return "wave"
    elif "spiral" in c:
        return "spiral"
    elif "parametric" in c:
        return "parametric"
    elif "star pattern" in c:
        return "ring"
    else:
        return "aimed"


def parse_amplitude_frequency(comments):
    """Extract amplitude and frequency from comments if present."""
    import re
    amplitude = 0
    frequency = 0
    amp_match = re.search(r'[Aa]mplitude[:\s]*([0-9.]+)', comments)
    freq_match = re.search(r'[Ff]requency[:\s]*([0-9.]+)', comments)
    if amp_match:
        amplitude = float(amp_match.group(1))
    if freq_match:
        frequency = float(freq_match.group(1))
    return amplitude, frequency


def normalize_effects(effects):
    """Normalize effect names, removing non-status entries."""
    norm_map = {
        "slow": "Slow", "slowed": "Slow",
        "paralyze": "Paralyze", "paralyzed": "Paralyze",
        "stun": "Stun", "stunned": "Stun",
        "daze": "Daze", "dazed": "Daze",
        "confuse": "Confuse", "confused": "Confuse",
        "blind": "Blind", "blinded": "Blind",
        "quiet": "Quiet", "quieted": "Quiet",
        "weak": "Weak", "weakened": "Weak",
        "sick": "Sick", "sickened": "Sick",
        "bleeding": "Bleeding",
        "armor break": "Armor Break", "armor broken": "Armor Break",
        "pet stasis": "Pet Stasis",
        "silence": "Silence", "silenced": "Silence",
        "curse": "Curse", "cursed": "Curse",
        "exposed": "Exposed",
        "darkness": "Darkness",
        "petrify": "Petrify", "petrified": "Petrify",
        "unstable": "Unstable",
    }
    # Skip non-status effects
    skip = {"piercing", "armor piercing", "passes cover", "parametric"}

    result = []
    for eff in effects:
        eff_lower = eff.lower().strip()
        # Remove duration info
        import re
        eff_clean = re.sub(r'\s*\(?\d+\.?\d*s?\)?$', '', eff_lower).strip()
        eff_clean = re.sub(r'\s+for\s+\d+\.?\d*s?$', '', eff_clean).strip()

        if eff_clean in skip:
            continue
        if eff_clean in norm_map:
            normalized = norm_map[eff_clean]
            if normalized not in result:
                result.append(normalized)

    return result


def main():
    monsters = []
    total_attacks = 0
    skipped = []

    for name, raw in RAW_DATA.items():
        if not raw["attacks"]:
            skipped.append((name, "no attacks (does not attack directly)"))
            # Still include the monster with empty attacks for reference
            # but skip if you want only combat monsters
            # For completeness, include them
            pass

        all_effects = set()
        attacks_out = []

        for atk in raw["attacks"]:
            if atk["damage"] is None:
                continue

            comments = atk.get("comments", "")
            amplitude, frequency = parse_amplitude_frequency(comments)
            pattern = parse_pattern(comments)
            effects = normalize_effects(atk.get("effects", []))

            for e in effects:
                all_effects.add(e)

            attack_obj = {
                "damage": atk["damage"],
                "projectileCount": atk.get("projCount", 1),
                "rateOfFire": 100,
                "range": atk.get("range", 0) if atk.get("range") is not None else 0,
                "amplitude": amplitude,
                "frequency": frequency,
                "effects": effects,
                "pattern": pattern
            }
            attacks_out.append(attack_obj)
            total_attacks += 1

        monster = {
            "name": name,
            "realmeyeUrl": raw["href"],
            "hp": raw["hp"],
            "def": raw["def"],
            "exp": raw["exp"],
            "attacks": attacks_out,
            "statusEffectsInflicted": sorted(list(all_effects)),
            "difficulty": classify_difficulty(name, raw["hp"], raw["exp"])
        }
        monsters.append(monster)

    # Sort by difficulty tier then name
    tier_order = {"low": 0, "mid": 1, "high": 2, "boss": 3}
    monsters.sort(key=lambda m: (tier_order.get(m["difficulty"], 2), m["name"]))

    # Write JSON
    json_path = os.path.join(OUTPUT_DIR, "realmeye_monsters.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(monsters, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(monsters)} monsters to {json_path}")

    # Count stats
    with_attacks = sum(1 for m in monsters if m["attacks"])
    without_attacks = sum(1 for m in monsters if not m["attacks"])
    low = sum(1 for m in monsters if m["difficulty"] == "low")
    mid = sum(1 for m in monsters if m["difficulty"] == "mid")
    high = sum(1 for m in monsters if m["difficulty"] == "high")
    boss = sum(1 for m in monsters if m["difficulty"] == "boss")

    # Write log
    log_lines = []
    log_lines.append(f"=== RealmEye Monster Scrape Log ===")
    log_lines.append(f"Date: {datetime.now().isoformat()}")
    log_lines.append(f"")
    log_lines.append(f"Source: https://www.realmeye.com/wiki/monster-index")
    log_lines.append(f"Note: RealmEye returns HTTP 204 to direct requests/scrapers.")
    log_lines.append(f"Data was collected using WebFetch tool which can access the pages.")
    log_lines.append(f"")
    log_lines.append(f"=== INDEX STATS ===")
    log_lines.append(f"Total monsters in index: ~900+ (estimated from full A-Z listing)")
    log_lines.append(f"Candidates selected: {len(RAW_DATA)}")
    log_lines.append(f"Monsters with usable combat data: {with_attacks}")
    log_lines.append(f"Monsters without attacks: {without_attacks}")
    log_lines.append(f"Total attack entries: {total_attacks}")
    log_lines.append(f"")
    log_lines.append(f"=== DIFFICULTY BREAKDOWN ===")
    log_lines.append(f"Low tier: {low}")
    log_lines.append(f"Mid tier: {mid}")
    log_lines.append(f"High tier: {high}")
    log_lines.append(f"Boss tier: {boss}")
    log_lines.append(f"")
    log_lines.append(f"=== SELECTION CRITERIA ===")
    log_lines.append(f"Monsters were selected to represent:")
    log_lines.append(f"- Beach/lowlands enemies (Pirate, Snake, Elf Archer, etc.)")
    log_lines.append(f"- Mid-range enemies (Dwarf King, Orc King, etc.)")
    log_lines.append(f"- Godlands enemies (Medusa, Beholder, White Demon, etc.)")
    log_lines.append(f"- Quest monsters (Ghost King, Lich, Ent Ancient, etc.)")
    log_lines.append(f"- Event bosses (Cube God, Skull Shrine, Grand Sphinx, etc.)")
    log_lines.append(f"- Dungeon bosses (Arachna, Stheno, Malphas, Septavius, etc.)")
    log_lines.append(f"- Endgame bosses (Oryx 1, Oryx 2, Marble Colossus, Void Entity)")
    log_lines.append(f"")
    log_lines.append(f"=== SKIPPED / NOTES ===")
    if skipped:
        for name, reason in skipped:
            log_lines.append(f"  {name}: {reason}")
    log_lines.append(f"  Scorpion Queen: included but has no attacks (does not attack)")
    log_lines.append(f"  Dr Terrible: included but has no direct attacks (spawns turrets)")
    log_lines.append(f"")
    log_lines.append(f"=== DATA NOTES ===")
    log_lines.append(f"- HP values are base HP (no scaling applied)")
    log_lines.append(f"- Speed from RealmEye is in tiles/sec; stored as range for game use")
    log_lines.append(f"- rateOfFire is set to 100 (default) as RealmEye uses cooldown-based timing")
    log_lines.append(f"- Amplitude/frequency extracted from comments where available (wavy shots)")
    log_lines.append(f"- 'Piercing' and 'Armor Piercing' are NOT counted as status effects")
    log_lines.append(f"- Pattern classification: aimed, spread, ring, bomb, wave, boomerang, spiral, parametric")
    log_lines.append(f"")
    log_lines.append(f"=== MONSTERS INCLUDED ===")
    for m in monsters:
        atk_count = len(m["attacks"])
        log_lines.append(f"  [{m['difficulty'].upper():4s}] {m['name']:40s} HP={str(m['hp']):>7s} DEF={str(m['def']):>3s} EXP={str(m['exp']):>6s} attacks={atk_count}")

    log_path = os.path.join(OUTPUT_DIR, "realmeye_scrape_log.txt")
    with open(log_path, "w", encoding="utf-8") as f:
        f.write("\n".join(log_lines))
    print(f"Wrote log to {log_path}")


if __name__ == "__main__":
    main()
