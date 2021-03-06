/* eslint-env node, browser*/
/* eslint no-unused-vars:0 , no-console:0*/

var Nightmare = require('nightmare'),
    prompt = require('prompt'),
    errors = [],
    fs = require('fs'),
    dsv = require('d3-dsv'),
    fixIt = true,
    SELECT = {
        gradeSchemeSelect : `select[title*="Grade Scheme"]`,
        mainButton: `button[primary=primary]`,
        saveButton : `d2l-floating-buttons button:nth-child(2)`,
        alertMessage : `[role="alert"]`
    };

//add the helpers on
require('nightmare-helpers')(Nightmare);

//because excel is a jurk and owns files
function getFreeFileName(name, end) {
    function getI(i) {
        return i > 0 ? i : '';
    }

    var fs = require('fs'),
        i = 0,
        gotOne = false,
        fullname;

    while (!gotOne) {
        try {
            fullname = name + getI(i) + end;
            fs.accessSync(fullname, fs.constants.F_OK);
            //if we make it to here then the file exist try again
            i += 1;
        } catch (e) {
            //the file does not exist yeah!
            gotOne = true;
        }
    }

    return fullname;
}

//this what it does when its done
function done(nightmare, promptData) {
    var errFileName = getFreeFileName("Errors", ".json");
    var coursesFileName = getFreeFileName("courseDataOut", ".csv");
    nightmare
        .end()
        .then(function () {
            var cols = ["name", "ou", "selectedValue", "newSelectedValue", "selectedText", "newSelectedText"];
            //write out the errors
            if (errors.length > 0) {
                console.log("Some OUs didn't work. Look in the file " + errFileName);
                fs.writeFileSync(errFileName, JSON.stringify(errors, null, 4), "utf8");
            }

            //write out the successes
            fs.writeFileSync(coursesFileName, dsv.csvFormat(promptData.ouList, cols), "utf8");
            console.log('See "' + coursesFileName + '" for data.');
            console.log("Finished All");
        });
}

function getCurrentGradeScale(SELECT) {
    var selected = document.querySelector(SELECT.gradeSchemeSelect).selectedOptions[0];
    return {
        selectedValue: selected.value,
        //the " are for excel
        selectedText: '"' + selected.text + '"'
    };
}

function fixFinalGradeScheme(index, nightmare, promptData) {
    nightmare
        //change the grade Scheme
        .select(SELECT.gradeSchemeSelect, promptData.gradeScale)
        //click save
        .click(SELECT.saveButton)
        //wait for the conformation
        .waitURL('feedback=2')
        //make sure it changed
        .evaluate(getCurrentGradeScale, SELECT)
        .then(function (data) {
            promptData.ouList[index].newSelectedValue = data.selectedValue;
            promptData.ouList[index].newSelectedText = data.selectedText;
            console.log("Done with " + promptData.ouList[index].name);

            goToNextCourse(index, nightmare, promptData);
        })
        .catch(function (e) {
            console.log("ERROR with " + promptData.ouList[index].name);
            errors.push({
                index: index,
                course: promptData.ouList[index],
                error: e
            });
            console.log("Done with " + promptData.ouList[index].name);
            goToNextCourse(index, nightmare, promptData);
        });

}


function goToNextCourse(index, nightmare, promptData) {
    index += 1;
    if (index === promptData.ouList.length) {
        done(nightmare, promptData);
        return;
    }
    //not done

    nightmare
        .run(function () {
            console.log((index + 1) + ":", "Starting " + promptData.ouList[index].name + " | " + promptData.ouList[index].ou);
        })
        //go to grades page
        .goto(promptData.urlPrefix + '/d2l/lms/grades/admin/manage/gradeslist.d2l?ou=' + promptData.ouList[index].ou)
        //wait for the final grade menu
        .wait('a[title="Actions for Final Calculated Grade"]')
        //click the menu 
        .click('a[title="Actions for Final Calculated Grade"]')
        .click('.vui-dropdown-menu ul li:first-child a')
        //go to page that we can change the final grade dropdown
        //change the grade scheme
        .wait(SELECT.gradeSchemeSelect)
        .evaluate(getCurrentGradeScale, SELECT)
        .then(function (data) {
            promptData.ouList[index].selectedValue = data.selectedValue;
            promptData.ouList[index].selectedText = data.selectedText;
            //see if we are just reading the current status
            if (fixIt) {
                fixFinalGradeScheme(index, nightmare, promptData);
            } else {
                goToNextCourse(index, nightmare, promptData);
            }
        })
        .catch(function (e) {
            console.log("Error with " + promptData.ouList[index].name);
            errors.push({
                index: index,
                course: promptData.ouList[index],
                error: e
            });
            goToNextCourse(index, nightmare, promptData);
        });
}


//This is what gets called after the prompt from cli.js
module.exports = function startNightmare(promptData) {
    //start up nightmare can use values from promptData
    var nightmare = Nightmare({
        show: true,
        //        openDevTools: {
        //            mode: 'detach'
        //        },
        typeInterval: 20,
        alwaysOnTop: false,
        waitTimeout: 15 * 1000,
        width: 1920,
        height: 1080
    });

    //start doing stuff with nightmare
    //most likely log in first
    nightmare
        .goto(promptData.urlPrefix + '/d2l/login?noredirect=1')
        .type("#userName", promptData.username)
        .type("#password", promptData.password)
        .click(SELECT.mainButton)
        .waitURL(promptData.urlPrefix + "/d2l/home")

        //manage grades > final caclc grade >
        // grade scheme > byui-standard or pathway 112 then save
        /*.goto(promptData.urlPrefix + '/d2l/lms/grades/admin/manage/gradeslist.d2l?ou=21680')
    .wait('a[title="Actions for Final Calculated Grade"]')
    .click('a[title="Actions for Final Calculated Grade"]')
    .click('.vui-dropdown-menu ul li:first-child a')
    //go to page that we can change the final grade dropdown
    //change the grade scheme
    .wait(SELECT.gradeSchemeSelect)
    .evaluate(getCurrentGradeScale)*/
        //.select(SELECT.gradeSchemeSelect, '112')



        .then(function () {
            goToNextCourse(-1, nightmare, promptData);
        })
        .catch(function (e) {
            errors.push(e);
            //goToNextCourse(-1, nightmare);
        });

}
