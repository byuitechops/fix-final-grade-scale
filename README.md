# fix-final-grade-scale

This program uses nightmarejs to change the grade scale in d2l courses to a given setting

## Install The Program

```
git clone https://github.com/byuitechops/fix-final-grade-scale.git
cd fix-final-grade-scale
npm install 
``` 
## Instructions
It will ask you all the things that you need to give it in the cli
   1. Grade Scale - use the value that is on the `option` elemet in the `select` element for the grade scale you want (Pathway_Standard). Use inspect to find the value.
   2. The csv listing the courses you want. See `testOus.csv` for an example. 
   3. Which domain do you want it in. Pathway or BYUI
   4. Username for the admin login
   5. Password for the admin login
   
Also see [course-list-generator](http://www.github.com/byuitechops/course-list-generator) for help in making the list of ou numbers.

