#!/usr/bin/env node

/* eslint-env node*/
/* eslint no-unused-vars:0 , no-console:0*/

var getInput = require('./getInput.js'),
    runNightmare = require('./nightmareLogic.js');

getInput(function (err, promptData) {
    if (err) {
        console.log(err);
        return;
    }

    console.log('Thank you, starting nightmare.');

    runNightmare(promptData);
});
