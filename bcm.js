import axios from 'axios';
import chalk from 'chalk';
import readline from "readline";
import fs from 'fs';

const rl = readline.createInterface({ 
    input: process.stdin,
    output: process.stdout
});

// STARTUP SPLASH
console.log(
    chalk.red(`
    ______                           _____                            ___  ___                                  
    | ___ \\                         /  __ \\                           |  \\/  |                                  
    | |_/ /_ __ _____      ___ __   | /  \\/ ___  _   _ _ __ ___  ___  | .  . | __ _ _ __   __ _  __ _  ___ _ __ 
    | ___ \\ '__/ _ \\ \\ /\\ / / '_ \\  | |    / _ \\| | | | '__/ __|/ _ \\ | |\\/| |/ _\` | '_ \\ / _\` |/ _\` |/ _ \\ '__|
    | |_/ / | | (_) \\ V  V /| | | | | \\__/\\ (_) | |_| | |  \\__ \\  __/ | |  | | (_| | | | | (_| | (_| |  __/ |   
    \\____/|_|  \\___/ \\_/\\_/ |_| |_|  \\____/\\___/ \\__,_|_|  |___/\\___| \\_|  |_/\\__,_|_| |_|\\__,_|\\__, |\\___|_|   
                                                                                                 __/ |          \n    `) 
    + chalk.bgRed("By: Milo (@onemilon)") + chalk.red(`                                                                        |___/           \n`)
);

// HELPERS
// ---------------------------------------------------------------------------------------------------

function parseSemID(input) {
    if(!isNaN(input)) return input; // input is already a semester ID

    let failed = false;
    let labelInfo = input.split(" ");

    let mod;
    if(labelInfo[0] == "Summer")      mod = 0;
    else if(labelInfo[0] == "Fall")   mod = 10;
    else if(labelInfo[0] == "Winter") mod = -85;
    else if(labelInfo[0] == "Spring") mod = -80;
    else {
        failed = true;
        console.log("Oops! Your input did not contain any semester keywords. Please try again.");
        userInput();
    }

    if(!failed) {
        console.log(`Your ${chalk.cyan("semester ID")} should be ${chalk.cyan(202000 + ((parseInt(labelInfo[1]) - 2020) * 100) + mod)}\n`);
        return (202000 + ((parseInt(labelInfo[1]) - 2020) * 100) + mod).toString();
    }
}

function displayHelp() {
    console.log(
        chalk.dim("———————————————————————————————————————————————————————————\n") +
        "Commands available:\n" + 
        "Help — Display this message\n" +
        chalk.italic("1 — Add Course to Favorites\n") +
        chalk.italic("2 — Add Courses from File to Favorites\n") +
        chalk.italic("3 — Remove Course from Favorites\n") +
        chalk.italic("4 — Clear all Courses from Favorites\n") +
        chalk.italic("5 — Check Favorites Availability in Semester\n") +
        chalk.italic("6 — List Favorite Courses\n") +
        chalk.dim("———————————————————————————————————————————————————————————\n")
    );
}


// TODO: improve using courses sample
function addCourseToFavorites(data, courseInput) {
    fs.readFile('favorites.json', function (jsonErr, jsonData) {
        let json = JSON.parse(jsonData)

        if(courseInput.includes(" ")) { // Based on code
            let words = courseInput.split(" ");
            let match = data["results"].find((course) => course["code"] == words[0] + " " + words[1]);
    
            if(match) {
                json["courses"].push(match);
                fs.writeFileSync("favorites.json", JSON.stringify(json));
                console.log("Added!\n");
                userInput();
            } else {
                console.log("No match found for course code! Please try again.\n");
                userInput();
            }
        } else if(!isNaN(courseInput)) { // Based on CRN
            let match = data["results"].find((course) => course["crn"] == courseInput);
    
            if(match) {
                json["courses"].push(match);
                fs.writeFileSync("favorites.json", JSON.stringify(json));
                console.log("Added!\n");
                userInput();
            } else {
                console.log("No match found for course CRN! Please try again.\n");
                userInput();
            }
        } else {
            console.log("Course format not recognized!\n");
            userInput();
        }
    });
}

function addCoursesToFavorites(data, pathInput) {
    fs.readFile('favorites.json', async function (jsonErr, jsonData) {
        let json = JSON.parse(jsonData);
        let lines = 0;

        const courseStream = readline.createInterface({
            input: fs.createReadStream(pathInput)
        });

        courseStream.on('line', function(courseInput) {
            if(courseInput.includes(" ")) { // Based on code
                let words = courseInput.split(" ");
                let match = data["results"].find((course) => course["code"] == words[0] + " " + words[1]);
        
                if(match) {
                    lines++;
                    json["courses"].push(match);
                }
            } else if(!isNaN(courseInput)) { // Based on CRN
                let match = data["results"].find((course) => course["crn"] == courseInput);
        
                if(match) {
                    lines++;
                    json["courses"].push(match);
                }
            } else {
                console.log("Course format not recognized!\n");
                userInput();
            }
        });
        courseStream.on('close', () => {
            fs.writeFileSync("favorites.json", JSON.stringify(json));
            console.log(`${lines} courses saved!\n`);
            userInput();
        })
    });
}

function removeCourseFromFavorites(courseInput) {
    fs.readFile('favorites.json', async function (jsonErr, jsonData) {
        let json = JSON.parse(jsonData);

        if(courseInput.includes(" ")) { // Based on code
            let words = courseInput.split(" ");
            let filteredList = json["courses"].filter((course) => course["code"] != words[0] + " " + words[1]);
            let filteredJson = { courses: filteredList };

            if(filteredJson["courses"].length == json["courses"].length) console.log(`Unable to find ${chalk.green("course code")} in favorites. Please try again.\n`);
            else {
                fs.writeFileSync("favorites.json", JSON.stringify(filteredJson));
                console.log("Course removed successfully!\n");
            }
        } else if(!isNaN(courseInput)) { // Based on CRN
            let filteredList = json["courses"].filter((course) => course["crn"] != courseInput);
            let filteredJson = { courses: filteredList };

            if(filteredJson["courses"].length == json["courses"].length) console.log(`Unable to find ${chalk.yellow("CRN")} in favorites. Please try again.\n`);
            else {
                fs.writeFileSync("favorites.json", JSON.stringify(filteredJson));
                console.log("Course removed successfully!\n");
            }
        } else {
            console.log("Course format not recognized!\n");
        }
        userInput();
    });
}

function printFavorites() {
    fs.readFile('favorites.json', async function (jsonErr, jsonData) {
        let json = JSON.parse(jsonData);

        console.log("Favorite courses:")
        for(const course in json["courses"]) {
            console.log(`☆ ${chalk.yellow("[" + json['courses'][course]['crn'] + "]")} ${json["courses"][course]["code"]} (${json["courses"][course]["title"]})`)
        }
        console.log();
        userInput();
    });
}

// COMMANDS
// ---------------------------------------------------------------------------------------------------

function userInput() {
    rl.question(`Enter a command or ${chalk.red("\"exit\"")} to end program: `, function(command) {
        command = command.toLowerCase();
        if(command == "exit") {
            rl.close();
        } else {
            if(command == "help") {
                displayHelp();
                userInput();
            }

            // Add courses to favorites
            else if(command == "1" || command == "2") {
                rl.question(`Enter ${chalk.cyan("semester ID")} or label: `, (semesterInput)=>{
                    let semID = parseSemID(semesterInput);

                    const dataPayload = {
                        other: {srcdb: semID},
                        criteria: [{field:"is_ind_study",value:"N"},{field:"is_canc",value:"N"}]
                    }
                    axios.post("https://cab.brown.edu/api/?page=fose&route=search&is_ind_study=N&is_canc=N", dataPayload)
                        .then(({data}) => {
                            if(data["fatal"]) {
                                console.log(`Error encountered requesting Brown's course list (is your semester correct?): "${data["fatal"]}"`);
                                userInput();
                            }
                            else if(command == "1") {
                                rl.question(`Enter ${chalk.yellow("course CRN")} or ${chalk.green("course code")}: `, (courseInput)=>{
                                    addCourseToFavorites(data, courseInput, true);
                                })
                            } else {
                                rl.question(`Enter ${chalk.yellow("path to file with line-separated courses")}: `, async (pathInput)=>{
                                    addCoursesToFavorites(data, pathInput);
                                })
                            }
                        })
                        .catch((err) => {
                            console.log(`Error encountered requesting Brown's course list (is your semester correct?): ${err}`);
                            userInput();
                        });
                });

            // Remove courses from favorites
            } else if(command == "3") {
                rl.question(`Enter ${chalk.yellow("course CRN")} or ${chalk.green("course code")}: `, (courseInput)=>{
                    removeCourseFromFavorites(courseInput);
                });

            // Clear favorites list
            } else if(command == "4") {
                fs.writeFileSync("favorites.json", "{\"courses\": []}");
                console.log("All courses removed!\n");
                userInput();

            // Check favorites availability
            } else if(command == "5") {
                rl.question(`Enter ${chalk.cyan("semester ID")} or label: `, (semesterInput)=>{
                    let semID = parseSemID(semesterInput);

                    const dataPayload = {
                        other: {srcdb: semID},
                        criteria: [{field:"is_ind_study",value:"N"},{field:"is_canc",value:"N"}]
                    }
                    axios.post("https://cab.brown.edu/api/?page=fose&route=search&is_ind_study=N&is_canc=N", dataPayload)
                        .then(({data}) => {
                            if(data["fatal"]) {
                                console.log(`Error encountered requesting Brown's course list (is your semester correct?): "${data["fatal"]}"`);
                                userInput();
                                return;
                            }
                            
                            fs.readFile('favorites.json', async function (jsonErr, jsonData) {
                                let json = JSON.parse(jsonData);
                                let coursesFound = [];
                                let coursesMissed = [];

                                for(const course in json["courses"]) {
                                    let result = data["results"].find((item) => item["crn"] == json["courses"][course]["crn"]);
                                    if(result) coursesFound.push(json["courses"][course]);
                                    else coursesMissed.push(json["courses"][course]);
                                }

                                console.log(`${chalk.green("Courses repeated:")}`);
                                for(let courseFound in coursesFound) {
                                    console.log(`+ ${chalk.green(coursesFound[courseFound]["code"])} (${coursesFound[courseFound]["title"]})`);
                                }
                                console.log(`\n\n${chalk.red("Courses not found:")}`);
                                for(let courseMissed in coursesMissed) {
                                    console.log(`- ${chalk.red(coursesMissed[courseMissed]["code"])} (${coursesMissed[courseMissed]["title"]})`);
                                }
                                console.log("\n");
                                userInput();
                            });
                        })
                        .catch((err) => {
                            console.log(`Error encountered requesting Brown's course list (is your semester correct?): ${err}`);
                            userInput();
                        })
                });

            // Print user favorites
            } else if(command == "6") {
                printFavorites();
            }
            //...
            else { 
                console.log(`Command not recognized. Please try again, or use "help" to display help message`);
                userInput();
            }
        }
    })
}

displayHelp();
userInput();