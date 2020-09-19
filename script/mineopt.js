/*******************************************************************
               Copyright (C) 2020 Guillaume Moroz

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.
                 http://www.gnu.org/licenses/
*******************************************************************/

const glpk = new Worker('/mineopt/script/glpk-worker.js');
glpk.onerror = (err) => {
    console.log(err);
};
glpk.onmessage = (evt) => {
    if(evt.data.result) {
        //console.log(evt.data);
        var round_trips = 0;
        for(let i = 0; i < raw.length; i++) {
            var num = evt.data.result.vars[raw[i]];
            if(num > 0) { 
                document.getElementById(raw[i]).value = num;
                round_trips += num;
            } else {
                document.getElementById(raw[i]).value = "";
            }
        }
        if(round_trips > 0) {
            document.getElementById("Total").value = round_trips;
        } else {
            document.getElementById("Total").value = "";
        }
        if(round_trips * time > 0) {
            document.getElementById("Time").value = round_trips * time;
        } else {
            document.getElementById("Time").value = "";
        }
    }
};
var ships_list = null;
var selected = null;
var base_yield = null;
var m3per100units = null;
var problem = null;
var test = null;
var time = 0;

var raw = [
  "Veldspar",
  "Scordite",
  "Pyroxeres",
  "Plagioclase",
  "Omber",
  "Kernit",
  "Jaspet",
  "Hemorphite",
  "Hedbergite",
  "Spodumain",
  "Dark_Ochre",
  "Gneiss",
  "Crockite",
  "Bistot",
  "Arkonor",
  "Mercoxit"
]

var processed = [
  "Tritanium",
  "Pyerite",
  "Mexallon",
  "Isogen",
  "Nocxium",
  "Zydrine",
  "Megacyte",
  "Morphite"
];

var distribution = {
    "Common": [ "Veldspar", "Scordite", "Plagioclase" ],
    "Uncommon": [ "Pyroxeres", "Omber", "Kernit", "Dark_Ochre" ],
    "Special": [ "Hemorphite", "Spodumain", "Gneiss" ],
    "Rare": [ "Jaspet", "Hedbergite", "Crockite" ],
    "Precious": [ "Bistot", "Arkonor", "Mercoxit" ]
}

var skills = {
    "Common": {"Basic": 0, "Advanced": 0, "Expert": 0},
    "Uncommon": {"Basic": 0, "Advanced": 0, "Expert": 0},
    "Special": {"Basic": 0, "Advanced": 0, "Expert": 0},
    "Rare": {"Basic": 0, "Advanced": 0, "Expert": 0},
    "Precious": {"Basic": 0, "Advanced": 0, "Expert": 0},
    "Frigate": {"Basic": 0, "Advanced": 0, "Expert": 0},
    "Destroyer": {"Basic": 0, "Advanced": 0, "Expert": 0},
    "Cruiser": {"Basic": 0, "Advanced": 0, "Expert": 0},
    "Battlecruiser": {"Basic": 0, "Advanced": 0, "Expert": 0},
    "Battleship": {"Basic": 0, "Advanced": 0, "Expert": 0},
    "Industrial": {"Basic": 0, "Advanced": 0, "Expert": 0}
}

var rate = {
  "Veldspar": 0.3,
  "Scordite": 0.3,
  "Pyroxeres": 0.3,
  "Plagioclase": 0.3,
  "Omber": 0.3,
  "Kernit": 0.3,
  "Jaspet": 0.3,
  "Hemorphite": 0.3,
  "Hedbergite": 0.3,
  "Spodumain": 0.3,
  "Dark_Ochre": 0.3,
  "Gneiss": 0.3,
  "Crockite": 0.3,
  "Bistot": 0.3,
  "Arkonor": 0.3,
  "Mercoxit": 0.3
}

var ship_rate = {
    "Frigate": 1,
    "Destroyer": 1,
    "Cruiser": 1,
    "Battlecruiser": 1,
    "Battleship": 1,
    "Industrial": 1
}
var capacity = 0;
var quantity = 1;

async function fill_ships() {
    ships_list = await fetch("/mineopt/data/ships.json").then(response => response.json());
    document.getElementById('Ships_list').selectedIndex = 0;

    for(i = 0; i < ships_list.length; i++) {
        var option = document.createElement('option');
        var optgroup = document.getElementById(ships_list[i].type);
        option.text = ships_list[i].name;
        option.value = i;
        optgroup.appendChild(option);
    }
}

async function init_problem() {
    base_yield = await fetch("/mineopt/data/base_yield.json").then(response => response.json());
    m3per100units = await fetch("/mineopt/data/m3per100units.json").then(response => response.json());
    problem = {
      "name": "mineopt",
      "generals": raw,
      "objective": {
        "direction": 1,
        "name": "roundtrips",
        "vars": [],
      },
      "subjectTo": [],
      "bounds": [],
      "options": {
        "msglev": 0
      }
    };
    for(let j=0; j < processed.length; j++) {
        var coefficients = [];
        for(let i=0; i < raw.length; i++) {
            coefficients.push({"name": raw[i], "coef": 0});
        }
        problem.subjectTo.push({
                "name": processed[j],
                "vars": coefficients,
                "bnds": {"type": 2, "lb": 0}
        });
    }
    for(let i=0; i < raw.length; i++) {
        problem.objective.vars.push({"name": raw[i], "coef": 1});
        problem.bounds.push({
            "name": raw[i],
            "type": 2,
            "lb": 0
        });
    }
}

function update_production(element, type, level) {
    element.setAttribute("value", element.value);
    skills[type][level] = element.value;
    ship_rate[type] = (150 - skills[type]["Basic"] * 6
                             - skills[type]["Advanced"] * 4
                             - skills[type]["Expert"])
                        / 150;
    if(selected && (selected.value >= 0)) {
        update_ship(selected);
    }
    backup_skills();
}

function update_skills(element, type, level) {
    element.setAttribute("value", element.value);
    skills[type][level] = element.value;
    for( let i = 0; i < distribution[type].length; i++) {
        rate[distribution[type][i]] =
            0.3
            + skills[type]["Basic"] * 0.3 * 0.1
            + skills[type]["Advanced"] * 0.3 * 0.05
            + skills[type]["Expert"] * 0.3 * 0.05
            + (skills[type]["Advanced"] > 0 ? 0.3*0.05 : 0);
    }
    update_subjectTo_coef();
    solve();
    backup_skills();
}

function update_time(element) {
    element.setAttribute("value", element.value);
    time = element.value;
    solve();
    backup_skills();
}

function update_capacity(element) {
    element.setAttribute("value", element.value);
    capacity = element.value;
    update_subjectTo_coef();
    solve();
    backup_skills();
}

function update_subjectTo_coef() {
    for(let j=0; j < processed.length; j++) {
        for(let i=0; i < raw.length; i++) {
            problem.subjectTo[j].vars[i].coef = base_yield[raw[i]][processed[j]] / m3per100units[raw[i]] * rate[raw[i]] * capacity;
        }
    }
}

function update_quantity(element) {
    element.setAttribute("value", element.value);
    var num = element.value == "" ? 1 : element.value;
    var ratio = num/quantity;
    quantity = num;
    for(let i = 0; i < processed.length; i++) {
        var num = Math.round(document.getElementById(processed[i]+"-target").value * ratio);
        document.getElementById(processed[i]+"-target").value = num;
        update_subjectTo_bnds(i);
    }
    solve();
    backup_ships();
}

function update_ship(element) {
    selected = element;
    if(selected && (selected.value >= 0)) {
        for(let i = 0; i < processed.length; i++) {
            var num = ships_list[element.value].resources[processed[i]];
            var mat_eff = ships_list[element.value].material_efficiency;
            var type = ships_list[element.value].type;
            var target = document.getElementById(processed[i]+"-target")
            target.value = Math.round(num * quantity * ship_rate[type] * 150/mat_eff);
            target.setAttribute("value", target.value);
            update_subjectTo_bnds(i);
        }
    } else {
        for(let i = 0; i < processed.length; i++) {
            var target = document.getElementById(processed[i]+"-target")
            target.value = "";
            target.setAttribute("value", target.value);
            update_subjectTo_bnds(i);
        }
    }
    solve();
    backup_ships();
}

function update_processed(num) {
    var credit = document.getElementById(processed[num] + "-credit");
    var target = document.getElementById(processed[num] + "-target");
    credit.setAttribute("value", credit.value);
    target.setAttribute("value", target.value);
    document.getElementById('Ships_list').selectedIndex = 0;
    selected = null;
    update_subjectTo_bnds(num);
    solve();
    backup_ships();
}

function update_subjectTo_bnds(num) {
    var credit = document.getElementById(processed[num] + "-credit").value;
    var target = document.getElementById(processed[num] + "-target").value;
    problem.subjectTo[num].bnds.lb = target - credit;
}

function solve() {
    //console.log(problem);
    glpk.postMessage(problem);
}

function backup_skills() {
    localStorage.skills = document.getElementById("Skills").innerHTML;
}

function backup_ships() {
    localStorage.ships = document.getElementById("Ships").innerHTML;
    localStorage.selected = document.getElementById("Ships_list").selectedIndex;
}

function restore_skills() {
    if(localStorage.skills) {
        var form = document.getElementById("Skills")
        var inputs = form.getElementsByTagName("input");
        form.innerHTML = localStorage.skills;
        for(let i = 0; i < inputs.length; i++) {
            inputs[i].oninput();
        }
    }
    if(localStorage.ships) {
        var form = document.getElementById("Ships")
        var index = localStorage.selected;
        form.innerHTML = localStorage.ships;
        var processed = document.getElementById("Processed")
        var inputs = processed.getElementsByTagName("input");
        for(let i = 0; i < inputs.length; i++) {
            inputs[i].oninput();
        }
        var value = document.getElementById("Quantity").value;
        quantity = value == "" ? 1 : value;
        if(index > 0) {
            var ships_list = document.getElementById("Ships_list")
            ships_list.selectedIndex = index;
            update_ship(ships_list.options[index]);
        }
    }
}

function init() {
    fill_ships();
    init_problem().then( () => restore_skills());
}


