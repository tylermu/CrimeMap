# St. Paul Crime Map & Database

An interactive website which displays St. Paul crime data on a map and table

## Description

This Vue-based program combines HTML and Javascript to host a RESTful API that connects to the main website to display crime data overlayed over an interactive map. The map on the website is overlayed by markers which plot 
neighborhood boundaries established by the St. Paul police dept. and individual crimes can also be plotted on the map using a button which adds markers to the map. Below the map is the table where you can view each crime individually, 
filter the crimes, add new crimes, plot data, and remove data. The RESTful API is hosted with CORS conditions that allow for insertion and deletion of data from the API, which allows the user to click buttons on the table that 
automatically communicate with the API to remove and add data to the database.

## Getting Started

### Dependencies

* This program should run on any Javascript/HTML compiler, it was ran on VSCode when being developed
* All the libraries necessary to run this program are embeded in the code and do not need to be downloaded from elsewhere.

### Installing

* To download the program, pull the entire repository into your preferred compiler
* Because the database file is too large to upload to github, do the following steps to get the database extracted. Find the stpaul_crime database.zip, and extract the sqlite3 file from inside. When you have the sqlite3 file you
  can delete the compressed folder. Now, create a new folder called "db" and drag the sqlite3 database into the folder. Now your database is setup and should be automatically connected via the path on the App.vue file.


### Executing program

* First, run the following command:
  ```
  npm install node
  ```
* In order to execute the program you will want to have open both the App.vue file (located in the src folder) and rest_server.mjs. When you have both of these open, either split your terminal or open them in different windows
  to allow two servers to be hosted, one for each of the files. Run the following command in the terminal for the App.vue file. Note: The port can be anything you choose, however rest_server.mjs will run on port 8001, so you cannot
  run the App.vue file on that port. 
  
  ```
  npm run dev -- -- port 7999
  ```
  Run the following command in the terminal for the rest_server.mjs file
  
  ```
  node .\rest_server.mjs
  ```

## Authors

Contributors names

Dylan Kraft
Khalid Mohamed
Thomas Marrinan


## Acknowledgments

Inspiration, code snippets, etc.
* [awesome-readme](https://github.com/matiassingers/awesome-readme)
* [webdev-dynamic](https://github.com/tmarrinan/webdev-dynamic)
